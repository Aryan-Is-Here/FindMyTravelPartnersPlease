-- FindMyTravelPartnersPlease — initial schema
-- Run this whole file once in Supabase Dashboard → SQL Editor.
--
-- Security model: other users' rows are NEVER selectable directly.
-- Everything cross-user goes through security-definer functions that
-- return only public columns. Phones only leave via get_party_contacts().

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------

create type gender_t as enum ('male', 'female', 'other');
create type gender_pref_t as enum ('male', 'female', 'any');
create type time_slot_t as enum ('early_morning', 'morning', 'afternoon', 'evening', 'night');
create type user_status_t as enum ('active', 'suspended');
create type request_kind_t as enum ('request', 'invite');
create type request_status_t as enum ('pending', 'accepted', 'rejected');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table users (
  college_id text primary key check (college_id ~ '^[A-Za-z0-9._-]{3,30}$'),
  auth_uid uuid not null unique default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  email text not null default '',
  avatar_url text,
  year smallint check (year between 1 and 6),
  show_year boolean not null default true,
  phone text not null check (phone ~ '^\+?[0-9]{10,13}$'),
  gender gender_t not null,
  budget int check (budget >= 0),
  status user_status_t not null default 'active',
  created_at timestamptz not null default now()
);

-- Current user's college_id (null if not onboarded / not signed in).
create or replace function me() returns text
language sql stable security definer set search_path = public as $$
  select college_id from users where auth_uid = auth.uid()
$$;

create table trip_prefs (
  user_id text primary key default me() references users (college_id) on delete cascade,
  bio text not null default '' check (char_length(bio) <= 500),
  gender_pref gender_pref_t not null default 'any',
  travel_mediums text[] not null default '{}'
    check (travel_mediums <@ array['bus', 'train', 'car', 'cab', 'flight', 'other']),
  destination_city text not null check (char_length(destination_city) between 1 and 60),
  travel_date date not null,
  preferred_time time_slot_t not null,
  updated_at timestamptz not null default now()
);

create table parties (
  id uuid primary key default gen_random_uuid(),
  head_id text not null default me() references users (college_id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  destination_city text not null check (char_length(destination_city) between 1 and 60),
  travel_date date not null,
  preferred_time time_slot_t not null,
  travel_medium text not null check (travel_medium in ('bus', 'train', 'car', 'cab', 'flight', 'other')),
  max_size smallint not null default 4 check (max_size between 2 and 10),
  expires_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create table party_members (
  party_id uuid not null references parties (id) on delete cascade,
  user_id text not null references users (college_id) on delete cascade,
  whatsapp_consent boolean not null default false,
  joined_at timestamptz not null default now(),
  primary key (party_id, user_id)
);

create table join_requests (
  id uuid primary key default gen_random_uuid(),
  party_id uuid not null references parties (id) on delete cascade,
  user_id text not null references users (college_id) on delete cascade,
  kind request_kind_t not null,
  status request_status_t not null default 'pending',
  created_at timestamptz not null default now(),
  unique (party_id, user_id)
);

create table messages (
  id bigint generated always as identity primary key,
  party_id uuid not null references parties (id) on delete cascade,
  user_id text not null default me() references users (college_id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index messages_party_idx on messages (party_id, created_at);

create table songs (
  id bigint generated always as identity primary key,
  party_id uuid not null references parties (id) on delete cascade,
  user_id text not null default me() references users (college_id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  link text check (link is null or link ~ '^https?://'),
  created_at timestamptz not null default now()
);

create table reports (
  reporter_id text not null references users (college_id) on delete cascade,
  target_id text not null references users (college_id) on delete cascade,
  reason text not null default '' check (char_length(reason) <= 300),
  created_at timestamptz not null default now(),
  primary key (reporter_id, target_id),
  check (reporter_id <> target_id)
);

create table feedback (
  user_id text not null references users (college_id) on delete cascade,
  party_id uuid not null references parties (id) on delete cascade,
  helpful boolean not null,
  created_at timestamptz not null default now(),
  primary key (user_id, party_id)
);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

-- Raises unless the caller is onboarded and not suspended. Returns college_id.
create or replace function require_active() returns text
language plpgsql stable security definer set search_path = public as $$
declare
  uid text;
  st user_status_t;
begin
  select college_id, status into uid, st from users where auth_uid = auth.uid();
  if uid is null then raise exception 'Not signed in or profile incomplete'; end if;
  if st <> 'active' then raise exception 'Account suspended'; end if;
  return uid;
end $$;

create or replace function party_active(p uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from parties where id = p and deleted_at is null and expires_at > now())
$$;

create or replace function is_member(p uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from party_members where party_id = p and user_id = me())
$$;

-- Both people's gender preferences allow each other.
create or replace function gender_compatible(g1 gender_t, p1 gender_pref_t, g2 gender_t, p2 gender_pref_t)
returns boolean language sql immutable as $$
  select (p1 = 'any' or p1::text = g2::text) and (p2 = 'any' or p2::text = g1::text)
$$;

create or replace function users_compatible(a text, b text) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((
    select gender_compatible(ua.gender, coalesce(ta.gender_pref, 'any'), ub.gender, coalesce(tb.gender_pref, 'any'))
    from users ua
    join users ub on ub.college_id = b
    left join trip_prefs ta on ta.user_id = ua.college_id
    left join trip_prefs tb on tb.user_id = ub.college_id
    where ua.college_id = a
  ), false)
$$;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

-- Server decides auth_uid, email and status. Client can't fake them.
create or replace function users_before_write() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    new.auth_uid := coalesce(auth.uid(), new.auth_uid);
    select email into new.email from auth.users where id = new.auth_uid;
    new.email := coalesce(new.email, '');
    new.status := 'active';
  else
    new.college_id := old.college_id;
    new.auth_uid := old.auth_uid;
    new.email := old.email;
    -- Only admin / security-definer code (not the client role) may change status.
    if current_user = 'authenticated' then new.status := old.status; end if;
  end if;
  return new;
end $$;

create trigger users_before_write before insert or update on users
for each row execute function users_before_write();

create or replace function trip_prefs_before_write() returns trigger
language plpgsql as $$
begin
  if tg_op = 'UPDATE' then new.user_id := old.user_id; end if;
  new.updated_at := now();
  return new;
end $$;

create trigger trip_prefs_before_write before insert or update on trip_prefs
for each row execute function trip_prefs_before_write();

create or replace function parties_before_write() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    new.head_id := require_active();
    if new.travel_date < current_date then raise exception 'Travel date is in the past'; end if;
    new.deleted_at := null;
  else
    new.head_id := old.head_id;
    new.created_at := old.created_at;
  end if;
  -- Room lives until 2 days after travel date.
  new.expires_at := (new.travel_date + 2)::timestamptz;
  return new;
end $$;

create trigger parties_before_write before insert or update on parties
for each row execute function parties_before_write();

create or replace function parties_after_insert() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into party_members (party_id, user_id) values (new.id, new.head_id);
  return new;
end $$;

create trigger parties_after_insert after insert on parties
for each row execute function parties_after_insert();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table users enable row level security;
alter table trip_prefs enable row level security;
alter table parties enable row level security;
alter table party_members enable row level security;
alter table join_requests enable row level security;
alter table messages enable row level security;
alter table songs enable row level security;
alter table reports enable row level security;
alter table feedback enable row level security;

-- users: own row only
create policy users_select on users for select to authenticated using (auth_uid = auth.uid());
create policy users_insert on users for insert to authenticated with check (auth_uid = auth.uid());
create policy users_update on users for update to authenticated using (auth_uid = auth.uid());

-- trip_prefs: own row only
create policy trip_select on trip_prefs for select to authenticated using (user_id = me());
create policy trip_insert on trip_prefs for insert to authenticated with check (user_id = me());
create policy trip_update on trip_prefs for update to authenticated using (user_id = me());

-- parties: active ones are visible to everyone signed in (no personal data);
-- create directly; head edits via update (deletion goes through delete_party()).
create policy parties_select on parties for select to authenticated
  using (deleted_at is null and expires_at > now() or is_member(id));
create policy parties_insert on parties for insert to authenticated with check (true);
create policy parties_update on parties for update to authenticated
  using (head_id = me() and deleted_at is null);

-- party_members: members of active party see each other; edit only own consent; leave (not head).
create policy members_select on party_members for select to authenticated
  using (is_member(party_id) and party_active(party_id));
create policy members_update on party_members for update to authenticated
  using (user_id = me() and party_active(party_id));
create policy members_delete on party_members for delete to authenticated
  using (user_id = me() and user_id <> (select head_id from parties where id = party_id));
revoke update on party_members from authenticated;
grant update (whatsapp_consent) on party_members to authenticated;

-- join_requests: requester/invitee and party head can see. Writes only via functions.
create policy requests_select on join_requests for select to authenticated
  using (user_id = me() or exists (select 1 from parties where id = party_id and head_id = me()));

-- messages / songs: members of active party only.
create policy messages_select on messages for select to authenticated
  using (is_member(party_id) and party_active(party_id));
create policy messages_insert on messages for insert to authenticated
  with check (user_id = me() and is_member(party_id) and party_active(party_id));

create policy songs_select on songs for select to authenticated
  using (is_member(party_id) and party_active(party_id));
create policy songs_insert on songs for insert to authenticated
  with check (user_id = me() and is_member(party_id) and party_active(party_id));
create policy songs_delete on songs for delete to authenticated
  using (user_id = me() or exists (select 1 from parties where id = party_id and head_id = me()));

-- reports / feedback: no direct access; functions only.

-- ---------------------------------------------------------------------------
-- RPC functions (called from the app)
-- ---------------------------------------------------------------------------

-- Main panel: people list with public columns only.
create or replace function browse_users(
  p_city text default null,
  p_date_from date default null,
  p_date_to date default null,
  p_medium text default null,
  p_year int default null,
  p_q text default null
) returns table (
  college_id text,
  name text,
  avatar_url text,
  year smallint,
  budget int,
  bio text,
  destination_city text,
  travel_date date,
  preferred_time time_slot_t,
  travel_mediums text[]
)
language plpgsql stable security definer set search_path = public as $$
declare
  my_id text := require_active();
  my_city text;
  my_date date;
begin
  select t.destination_city, t.travel_date into my_city, my_date from trip_prefs t where t.user_id = my_id;
  return query
  select u.college_id, u.name, u.avatar_url,
         case when u.show_year then u.year else null end,
         u.budget, t.bio, t.destination_city, t.travel_date, t.preferred_time,
         t.travel_mediums
  from users u
  join trip_prefs t on t.user_id = u.college_id
  where u.college_id <> my_id
    and u.status = 'active'
    and t.travel_date >= current_date
    and users_compatible(my_id, u.college_id)
    and (p_city is null or t.destination_city ilike p_city)
    and (p_date_from is null or t.travel_date >= p_date_from)
    and (p_date_to is null or t.travel_date <= p_date_to)
    and (p_medium is null or p_medium = any (t.travel_mediums))
    and (p_year is null or (u.show_year and u.year = p_year))
    and (p_q is null or u.name ilike '%' || p_q || '%')
  order by (t.destination_city ilike coalesce(my_city, '')) desc,
           abs(t.travel_date - coalesce(my_date, current_date)),
           u.name
  limit 200;
end $$;

-- Main panel: open parties.
create or replace function browse_parties(
  p_city text default null,
  p_date_from date default null,
  p_date_to date default null,
  p_medium text default null
) returns table (
  id uuid,
  name text,
  destination_city text,
  travel_date date,
  preferred_time time_slot_t,
  travel_medium text,
  max_size smallint,
  member_count int,
  head_name text,
  head_avatar text,
  my_status text -- 'member' | 'requested' | 'invited' | 'rejected' | null
)
language plpgsql stable security definer set search_path = public as $$
declare
  my_id text := require_active();
  my_city text;
  my_date date;
begin
  select t.destination_city, t.travel_date into my_city, my_date from trip_prefs t where t.user_id = my_id;
  return query
  select p.id, p.name, p.destination_city, p.travel_date, p.preferred_time, p.travel_medium, p.max_size,
         (select count(*)::int from party_members m where m.party_id = p.id),
         h.name, h.avatar_url,
         case
           when exists (select 1 from party_members m where m.party_id = p.id and m.user_id = my_id) then 'member'
           else (select case when r.status = 'pending' and r.kind = 'request' then 'requested'
                             when r.status = 'pending' and r.kind = 'invite' then 'invited'
                             when r.status = 'rejected' then 'rejected' end
                 from join_requests r where r.party_id = p.id and r.user_id = my_id)
         end
  from parties p
  join users h on h.college_id = p.head_id
  where p.deleted_at is null and p.expires_at > now()
    and h.status = 'active'
    and (p.head_id = my_id or users_compatible(my_id, p.head_id))
    and (p_city is null or p.destination_city ilike p_city)
    and (p_date_from is null or p.travel_date >= p_date_from)
    and (p_date_to is null or p.travel_date <= p_date_to)
    and (p_medium is null or p.travel_medium = p_medium)
  order by (p.destination_city ilike coalesce(my_city, '')) desc,
           abs(p.travel_date - coalesce(my_date, current_date))
  limit 200;
end $$;

create or replace function party_has_room(p uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select (select count(*) from party_members where party_id = p) < (select max_size from parties where id = p)
$$;

-- User asks to join a party.
create or replace function request_join(p uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  my_id text := require_active();
  head text;
begin
  select head_id into head from parties where id = p and deleted_at is null and expires_at > now();
  if head is null then raise exception 'Party not found or ended'; end if;
  if exists (select 1 from party_members where party_id = p and user_id = my_id) then
    raise exception 'Already a member';
  end if;
  if not users_compatible(my_id, head) then raise exception 'Not available'; end if;
  if not party_has_room(p) then raise exception 'Party is full'; end if;
  if exists (select 1 from join_requests where party_id = p and user_id = my_id and kind = 'invite' and status = 'pending') then
    raise exception 'You already have an invite to this party — accept it from your notifications';
  end if;
  if exists (select 1 from join_requests where party_id = p and user_id = my_id and status = 'rejected') then
    raise exception 'Your earlier request was declined';
  end if;
  insert into join_requests (party_id, user_id, kind) values (p, my_id, 'request')
  on conflict (party_id, user_id) do nothing;
end $$;

-- Party head invites a user.
create or replace function invite_user(p uuid, target text) returns void
language plpgsql security definer set search_path = public as $$
declare
  my_id text := require_active();
begin
  if not exists (select 1 from parties where id = p and head_id = my_id and deleted_at is null and expires_at > now()) then
    raise exception 'Only the party head can invite';
  end if;
  if not exists (select 1 from users where college_id = target and status = 'active') then
    raise exception 'User not found';
  end if;
  if exists (select 1 from party_members where party_id = p and user_id = target) then
    raise exception 'Already a member';
  end if;
  if not users_compatible(my_id, target) then raise exception 'Not available'; end if;
  if not party_has_room(p) then raise exception 'Party is full'; end if;
  insert into join_requests (party_id, user_id, kind) values (p, target, 'invite')
  on conflict (party_id, user_id) do update set kind = 'invite', status = 'pending', created_at = now()
    where join_requests.status = 'rejected' and join_requests.kind = 'request';
end $$;

-- Accept/reject. Head answers 'request'; invited user answers 'invite'.
create or replace function respond_request(req uuid, accept boolean) returns void
language plpgsql security definer set search_path = public as $$
declare
  my_id text := require_active();
  r join_requests;
  head text;
begin
  select * into r from join_requests where id = req for update;
  if r.id is null or r.status <> 'pending' then raise exception 'Request not found'; end if;
  select head_id into head from parties where id = r.party_id and deleted_at is null and expires_at > now();
  if head is null then raise exception 'Party ended'; end if;
  if (r.kind = 'request' and my_id <> head) or (r.kind = 'invite' and my_id <> r.user_id) then
    raise exception 'Not allowed';
  end if;
  if accept then
    if not party_has_room(r.party_id) then raise exception 'Party is full'; end if;
    insert into party_members (party_id, user_id) values (r.party_id, r.user_id) on conflict do nothing;
    update join_requests set status = 'accepted' where id = req;
  else
    update join_requests set status = 'rejected' where id = req;
  end if;
end $$;

-- Notifications / "people who want to travel with you".
create or replace function my_inbox() returns table (
  request_id uuid,
  kind request_kind_t,
  party_id uuid,
  party_name text,
  other_name text,
  other_avatar text,
  other_year smallint,
  other_bio text,
  created_at timestamptz
)
language plpgsql stable security definer set search_path = public as $$
declare
  my_id text := require_active();
begin
  return query
  -- people asking to join my parties
  select r.id, r.kind, p.id, p.name, u.name, u.avatar_url,
         case when u.show_year then u.year end, t.bio, r.created_at
  from join_requests r
  join parties p on p.id = r.party_id
  join users u on u.college_id = r.user_id
  left join trip_prefs t on t.user_id = u.college_id
  where p.head_id = my_id and r.kind = 'request' and r.status = 'pending'
    and p.deleted_at is null and p.expires_at > now() and u.status = 'active'
  union all
  -- parties inviting me
  select r.id, r.kind, p.id, p.name, h.name, h.avatar_url,
         case when h.show_year then h.year end, t.bio, r.created_at
  from join_requests r
  join parties p on p.id = r.party_id
  join users h on h.college_id = p.head_id
  left join trip_prefs t on t.user_id = h.college_id
  where r.user_id = my_id and r.kind = 'invite' and r.status = 'pending'
    and p.deleted_at is null and p.expires_at > now() and h.status = 'active'
  order by 9 desc;
end $$;

-- Active parties I'm in.
create or replace function my_parties() returns table (
  id uuid, name text, destination_city text, travel_date date, preferred_time time_slot_t,
  travel_medium text, member_count int, max_size smallint, is_head boolean
)
language plpgsql stable security definer set search_path = public as $$
declare
  my_id text := require_active();
begin
  return query
  select p.id, p.name, p.destination_city, p.travel_date, p.preferred_time, p.travel_medium,
         (select count(*)::int from party_members m2 where m2.party_id = p.id), p.max_size,
         p.head_id = my_id
  from parties p
  join party_members m on m.party_id = p.id and m.user_id = my_id
  where p.deleted_at is null and p.expires_at > now()
  order by p.travel_date;
end $$;

-- Room member list (public columns only).
create or replace function get_party_members(p uuid) returns table (
  college_id text, name text, avatar_url text, year smallint, whatsapp_consent boolean, is_head boolean
)
language plpgsql stable security definer set search_path = public as $$
declare
  my_id text := require_active();
begin
  if not (is_member(p) and party_active(p)) then raise exception 'Not a member'; end if;
  return query
  select u.college_id, u.name, u.avatar_url, case when u.show_year then u.year end,
         m.whatsapp_consent, u.college_id = pa.head_id
  from party_members m
  join users u on u.college_id = m.user_id
  join parties pa on pa.id = m.party_id
  where m.party_id = p
  order by (u.college_id = pa.head_id) desc, m.joined_at;
end $$;

-- Phones: only if I consented, and only of members who consented.
create or replace function get_party_contacts(p uuid) returns table (college_id text, name text, phone text)
language plpgsql stable security definer set search_path = public as $$
declare
  my_id text := require_active();
begin
  if not party_active(p) or not exists (
    select 1 from party_members where party_id = p and user_id = my_id and whatsapp_consent
  ) then
    raise exception 'Share your number first to see others';
  end if;
  return query
  select u.college_id, u.name, u.phone
  from party_members m join users u on u.college_id = m.user_id
  where m.party_id = p and m.whatsapp_consent;
end $$;

-- Head deletes room. Chat and songs are wiped immediately.
create or replace function delete_party(p uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  my_id text := require_active();
begin
  update parties set deleted_at = now() where id = p and head_id = my_id and deleted_at is null;
  if not found then raise exception 'Only the party head can delete this room'; end if;
  delete from messages where party_id = p;
  delete from songs where party_id = p;
  update join_requests set status = 'rejected' where party_id = p and status = 'pending';
end $$;

-- Report a user. Only people you've actually interacted with. 3 unique reports → suspended.
create or replace function report_user(target text, reason text default '') returns void
language plpgsql security definer set search_path = public as $$
declare
  my_id text := require_active();
  connected boolean;
begin
  if target = my_id then raise exception 'Cannot report yourself'; end if;
  select exists (
    select 1 from party_members a join party_members b on a.party_id = b.party_id
    where a.user_id = my_id and b.user_id = target
  ) or exists (
    select 1 from join_requests r join parties p on p.id = r.party_id
    where (r.user_id = my_id and p.head_id = target) or (r.user_id = target and p.head_id = my_id)
  ) into connected;
  if not connected then
    raise exception 'You can only report people you have shared a party or request with';
  end if;
  insert into reports (reporter_id, target_id, reason) values (my_id, target, left(coalesce(reason, ''), 300))
  on conflict do nothing;
  if (select count(*) from reports where target_id = target) >= 3 then
    update users set status = 'suspended' where college_id = target;
  end if;
end $$;

-- Ended parties (deleted or expired) I was in and haven't rated yet.
create or replace function pending_feedback() returns table (party_id uuid, party_name text)
language plpgsql stable security definer set search_path = public as $$
declare
  my_id text := require_active();
begin
  return query
  select p.id, p.name
  from parties p
  join party_members m on m.party_id = p.id and m.user_id = my_id
  where (p.deleted_at is not null or p.expires_at <= now())
    and not exists (select 1 from feedback f where f.party_id = p.id and f.user_id = my_id)
  order by coalesce(p.deleted_at, p.expires_at) desc;
end $$;

create or replace function submit_feedback(p uuid, is_helpful boolean) returns void
language plpgsql security definer set search_path = public as $$
declare
  my_id text := require_active();
begin
  if not exists (select 1 from party_members where party_id = p and user_id = my_id) then
    raise exception 'Not a member';
  end if;
  insert into feedback (user_id, party_id, helpful) values (my_id, p, is_helpful)
  on conflict do nothing;
end $$;

-- ---------------------------------------------------------------------------
-- Grants: functions only for signed-in users
-- ---------------------------------------------------------------------------

revoke execute on all functions in schema public from public, anon;
grant execute on all functions in schema public to authenticated;
revoke all on all tables in schema public from anon;

-- ---------------------------------------------------------------------------
-- Realtime (chat + notification bell)
-- ---------------------------------------------------------------------------

alter publication supabase_realtime add table messages, join_requests;

-- ---------------------------------------------------------------------------
-- Storage: avatars (public read, users write only their own folder)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy avatars_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy avatars_update on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy avatars_delete on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------------------
-- Daily cleanup of expired rooms' chat + songs (pg_cron)
-- If this errors, enable pg_cron under Database → Extensions, then rerun this block.
-- ---------------------------------------------------------------------------

create extension if not exists pg_cron;

select cron.schedule(
  'purge-ended-parties',
  '0 3 * * *',
  $$
    delete from public.messages where party_id in (select id from public.parties where expires_at <= now());
    delete from public.songs where party_id in (select id from public.parties where expires_at <= now());
  $$
);

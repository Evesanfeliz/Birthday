alter table public.rooms
add column name text;

update public.rooms
set name = 'Party ' || code
where name is null;

alter table public.rooms
alter column name set not null;


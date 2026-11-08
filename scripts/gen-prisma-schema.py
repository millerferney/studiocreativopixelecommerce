#!/usr/bin/env python3
"""Genera prisma/schema.postgres.prisma leyendo el catálogo de PostgreSQL (alternativa a `prisma db pull`).
Uso:  DIRECT_URL=postgresql://... python3 scripts/gen-prisma-schema.py > prisma/schema.postgres.prisma
"""
import os, re, subprocess, sys, csv, io

URL = os.environ.get("DIRECT_URL", "postgresql://pixel:pixel@localhost:5432/pixel_test")

def q(sql):
    out = subprocess.run(["psql", URL, "-At", "-F", "\t", "-c", sql], capture_output=True, text=True, check=True).stdout
    return [l.split("\t") for l in out.strip().split("\n") if l]

def camel(s):
    p = s.split("_"); return p[0] + "".join(x.title() for x in p[1:])
def pad(s, n):
    return s + " " * max(1, n - len(s))
def pascal(s): return "".join(x.title() for x in s.split("_"))

tables = [r[0] for r in q("select tablename from pg_tables where schemaname='public' order by 1")]
cols = {}
for t in tables:
    cols[t] = q(f"""select column_name, data_type, udt_name, is_nullable, coalesce(column_default,''),
        coalesce(character_maximum_length::text,''), coalesce(numeric_precision::text,''), coalesce(numeric_scale::text,''),
        is_identity from information_schema.columns where table_schema='public' and table_name='{t}' order by ordinal_position""")
pk = {t: [r[0] for r in q(f"""select a.attname from pg_index i join pg_attribute a on a.attrelid=i.indrelid and a.attnum=any(i.indkey)
        where i.indrelid='public.{t}'::regclass and i.indisprimary order by array_position(i.indkey, a.attnum)""")] for t in tables}
uniq = {}
for t in tables:
    rows = q(f"""select i.indexrelid::regclass::text, array_to_string(array(select a.attname from pg_attribute a where a.attrelid=i.indrelid and a.attnum=any(i.indkey) order by array_position(i.indkey,a.attnum)),','),
        (i.indpred is not null)::text, (i.indexprs is not null)::text from pg_index i where i.indrelid='public.{t}'::regclass and i.indisunique and not i.indisprimary""")
    uniq[t] = [r[1].split(",") for r in rows if r[2] == "false" and r[3] == "false"]
fks = []
for r in q("""select c.conrelid::regclass::text, (select string_agg(a.attname, ',' order by x.ord) from unnest(c.conkey) with ordinality x(k,ord) join pg_attribute a on a.attrelid=c.conrelid and a.attnum=x.k),
        c.confrelid::regclass::text, (select string_agg(a.attname, ',' order by x.ord) from unnest(c.confkey) with ordinality x(k,ord) join pg_attribute a on a.attrelid=c.confrelid and a.attnum=x.k),
        c.confdeltype from pg_constraint c where c.contype='f' and c.connamespace='public'::regnamespace"""):
    fks.append(dict(src=r[0], scols=r[1].split(","), dst=r[2], dcols=r[3].split(","), ondel=r[4]))

def ptype(udt, dt, ln, prec, scale):
    if udt == "int4": return "Int", ""
    if udt == "int2": return "Int", "@db.SmallInt"
    if udt == "int8": return "BigInt", ""
    if udt == "varchar": return "String", f"@db.VarChar({ln})"
    if udt == "bpchar": return "String", f"@db.Char({ln})"
    if udt == "text": return "String", ""
    if udt == "bool": return "Boolean", ""
    if udt == "numeric": return "Decimal", f"@db.Decimal({prec}, {scale})"
    if udt == "timestamptz": return "DateTime", "@db.Timestamptz(6)"
    if udt == "date": return "DateTime", "@db.Date"
    raise SystemExit(f"tipo no soportado: {udt}")

def default(d, ptype_, ident):
    if ident == "YES": return "@default(autoincrement())"
    if not d: return ""
    if d == "now()": return "@default(now())"
    if d in ("true", "false"): return f"@default({d})"
    m = re.match(r"^'(.*)'::[\w\s]+$", d)
    if m: return f'@default("{m.group(1)}")'
    if re.match(r"^-?\d+(\.\d+)?$", d): return f"@default({d})"
    return '@default(dbgenerated("' + d.replace('"', '\\"') + '"))'

fk_by_src = {}
for f in fks: fk_by_src.setdefault(f["src"], []).append(f)
out = ['generator client {\n  provider = "prisma-client"\n  output   = "../src/generated/prisma"\n}\n\ndatasource db {\n  provider = "postgresql"\n}\n',
       '// ARCHIVO GENERADO por scripts/gen-prisma-schema.py a partir de db/01_schema.sql.\n// La fuente de verdad del esquema es el SQL; Prisma solo se usa como cliente tipado.\n']

for t in tables:
    M = pascal(t)
    lines = []
    fkcols = {c for f in fk_by_src.get(t, []) for c in f["scols"]}
    single_pk = len(pk[t]) == 1
    for (cn, dt, udt, nul, d, ln, prec, scale, ident) in cols[t]:
        ty, attr = ptype(udt, dt, ln, prec, scale)
        opt = "?" if nul == "YES" else ""
        parts = []
        if single_pk and cn == pk[t][0]: parts.append("@id")
        if [cn] in uniq[t]: parts.append("@unique")
        dflt = default(d, ty, ident)
        if cn in ("updated_at",): dflt = "@default(now()) @updatedAt"
        if dflt: parts.append(dflt)
        if camel(cn) != cn: parts.append(f'@map("{cn}")')
        if attr: parts.append(attr)
        lines.append(f"  {pad(camel(cn), 22)}{pad(ty+opt, 12)}{' '.join(parts)}".rstrip())
    # relaciones directas
    for f in fk_by_src.get(t, []):
        D = pascal(f["dst"])
        name = camel(f["dst"])
        nullable = any(c[3] == "YES" for c in cols[t] if c[0] in f["scols"])
        ondel = {"c": ", onDelete: Cascade", "n": ", onDelete: SetNull", "r": ", onDelete: Restrict", "a": ""}[f["ondel"]]
        lines.append(f"  {pad(name, 22)}{pad(D+('?' if nullable else ''), 12)}@relation(fields: [{', '.join(camel(c) for c in f['scols'])}], references: [{', '.join(camel(c) for c in f['dcols'])}]{ondel})")
    # relaciones inversas
    for f in fks:
        if f["dst"] != t: continue
        S = pascal(f["src"])
        is_one = (f["scols"] == pk[f["src"]]) or (f["scols"] in uniq[f["src"]])
        if is_one: lines.append(f"  {pad(camel(f['src']), 22)}{pad(S+'?', 12)}")
        else: lines.append(f"  {pad(camel(f['src'])+'s', 22)}{pad(S+'[]', 12)}")
    if not single_pk:
        lines.append(f"  @@id([{', '.join(camel(c) for c in pk[t])}])")
    for u in uniq[t]:
        if len(u) > 1: lines.append(f"  @@unique([{', '.join(camel(c) for c in u)}])")
    lines.append(f'  @@map("{t}")')
    out.append(f"model {M} {{\n" + "\n".join(lines) + "\n}\n")
print("\n".join(out))

#!/usr/bin/env python3
"""Deriva prisma/schema.mysql.prisma a partir de prisma/schema.postgres.prisma (la fuente generada desde la BD).
Uso:  python3 scripts/gen-prisma-mysql.py > prisma/schema.mysql.prisma
Diferencias que aplica: proveedor, tipos nativos de fecha/texto y defaults generados por secuencias (en MySQL los
asignan los triggers de db/mysql/01_schema.sql). Las columnas generadas (abierto_flag, aprobado_flag, prefijo_activo)
no se declaran: Prisma no debe escribirlas.
"""
import re, sys
src = open("prisma/schema.postgres.prisma", encoding="utf-8").read()
src = src.replace('provider = "postgresql"', 'provider = "mysql"')
src = src.replace("@db.Timestamptz(6)", "@db.DateTime(3)")
src = re.sub(r'@default\(dbgenerated\("[^"]*(?:nextval|lpad)[^"]*"\)\)', '@default("")', src)

out = []
for line in src.split("\n"):
    m = re.match(r"^(\s+)(\w+)(\s+)(String\??)(\s*)(.*)$", line)
    if m and "@db." not in line and "@relation" not in line:
        ind, name, sp, typ, sp2, rest = m.groups()
        nativo = "@db.LongText" if name == "xmlUbl" else "@db.Text"
        rest = (rest + " " + nativo).strip()
        line = f"{ind}{name}{sp}{typ}{sp2}{rest}"
    out.append(line)
sys.stdout.write("// ARCHIVO GENERADO por scripts/gen-prisma-mysql.py desde schema.postgres.prisma. No editar a mano.\n" + "\n".join(out))

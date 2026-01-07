#!/bin/bash
# Script para aplicar migrações no banco de dados de produção

echo "🔄 Aplicando migrações no banco de dados de produção..."
echo ""
echo "⚠️  IMPORTANTE: Certifique-se de que a variável DATABASE_URL está configurada"
echo "   com a URL do banco de dados de produção (PostgreSQL)"
echo ""

# Aplica as migrações
npx prisma migrate deploy

echo ""
echo "✅ Migrações aplicadas com sucesso!"
echo ""
echo "Para verificar o status do banco:"
echo "  npx prisma migrate status"

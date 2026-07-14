import { PrismaClient, Brand, ActivityType, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

async function main() {
  console.log("Seeding database...");

  // ---------- Usuários ----------
  const passwordHash = await bcrypt.hash("veron@2026", 10);

  const marina = await prisma.user.upsert({
    where: { email: "marina@veronproducoes.com.br" },
    update: {},
    create: {
      name: "Marina Silva",
      email: "marina@veronproducoes.com.br",
      passwordHash,
      role: Role.ADMIN,
    },
  });

  const rafael = await prisma.user.upsert({
    where: { email: "rafael@veronproducoes.com.br" },
    update: {},
    create: {
      name: "Rafael Costa",
      email: "rafael@veronproducoes.com.br",
      passwordHash,
      role: Role.COMERCIAL,
    },
  });

  const bruna = await prisma.user.upsert({
    where: { email: "bruna@veronproducoes.com.br" },
    update: {},
    create: {
      name: "Bruna Alves",
      email: "bruna@veronproducoes.com.br",
      passwordHash,
      role: Role.COMERCIAL,
    },
  });

  const diego = await prisma.user.upsert({
    where: { email: "diego@veronproducoes.com.br" },
    update: {},
    create: {
      name: "Diego Ramos",
      email: "diego@veronproducoes.com.br",
      passwordHash,
      role: Role.FINANCEIRO,
    },
  });

  // ---------- Colunas do Kanban ----------
  const columnDefs = [
    { id: "leads", name: "Leads", color: "#8B8FA8", position: 0 },
    { id: "primeiro_contato", name: "Primeiro Contato", color: "#4C6EF5", position: 1 },
    { id: "negociacao", name: "Em Negociação", color: "#F5A623", position: 2 },
    { id: "proposta", name: "Proposta Enviada", color: "#0F9D8B", position: 3 },
    { id: "aguardando", name: "Aguardando Retorno", color: "#9C6ADE", position: 4 },
    { id: "fechado", name: "Cliente Fechado", color: "#12B76A", position: 5 },
    { id: "perdido", name: "Perdido", color: "#E5484D", position: 6 },
  ];

  for (const c of columnDefs) {
    await prisma.kanbanColumn.upsert({
      where: { id: c.id },
      update: {},
      create: c,
    });
  }

  // ---------- Clientes de exemplo ----------
  const seedClients = [
    { company: "Padaria Bom Sabor", contact: "João Mendes", phone: "(11) 3344-5566", whatsapp: "(11) 98877-6655", email: "joao@bomsabor.com", city: "São Paulo", responsible: marina.id, createdAt: daysAgo(2), stage: "leads", origin: "Instagram", brand: [Brand.VERON], subs: { veron: true, arena360: true } },
    { company: "Colégio Nova Era", contact: "Fernanda Lopes", phone: "(11) 4455-6677", whatsapp: "(11) 97766-5544", email: "fernanda@novaera.edu.br", city: "Campinas", responsible: rafael.id, createdAt: daysAgo(5), stage: "leads", origin: "Indicação", brand: [Brand.ARENA360], subs: { veron: true, arena360: true } },
    { company: "Clínica VidaPlus", contact: "Dr. Marcos Tavares", phone: "(19) 3322-1100", whatsapp: "(19) 98811-2233", email: "marcos@vidaplus.com", city: "Sorocaba", responsible: bruna.id, createdAt: daysAgo(8), stage: "primeiro_contato", origin: "Google Ads", brand: [Brand.VERON], subs: { veron: false, arena360: true }, favorite: true },
    { company: "Metalúrgica Ferraz", contact: "Carlos Ferraz", phone: "(11) 2211-3344", whatsapp: "(11) 96655-4433", email: "carlos@ferraz.ind.br", city: "Guarulhos", responsible: diego.id, createdAt: daysAgo(12), stage: "primeiro_contato", origin: "Site", brand: [Brand.ARENA360], subs: { veron: true, arena360: true } },
    { company: "Studio Criativo Lumen", contact: "Ana Beatriz", phone: "(11) 5544-3322", whatsapp: "(11) 95544-3322", email: "ana@lumen.studio", city: "São Paulo", responsible: marina.id, createdAt: daysAgo(15), stage: "negociacao", origin: "Indicação", brand: [Brand.VERON, Brand.ARENA360], subs: { veron: true, arena360: true } },
    { company: "TechFlow Sistemas", contact: "Bruno Cardoso", phone: "(19) 4433-2211", whatsapp: "(19) 99988-7766", email: "bruno@techflow.com.br", city: "Campinas", responsible: rafael.id, createdAt: daysAgo(20), stage: "negociacao", origin: "Cold Call", brand: [Brand.ARENA360], subs: { veron: true, arena360: true }, favorite: true },
    { company: "Mercado Central", contact: "Sueli Rocha", phone: "(11) 3300-4400", whatsapp: "(11) 94433-2211", email: "sueli@mercadocentral.com", city: "Osasco", responsible: bruna.id, createdAt: daysAgo(22), stage: "proposta", origin: "Evento", brand: [Brand.VERON], subs: { veron: true, arena360: false } },
    { company: "Instituto Saber+", contact: "Patrícia Nunes", phone: "(11) 2299-1100", whatsapp: "(11) 93322-1100", email: "patricia@sabermais.edu.br", city: "São Paulo", responsible: diego.id, createdAt: daysAgo(25), stage: "proposta", origin: "Site", brand: [Brand.ARENA360], subs: { veron: true, arena360: true } },
    { company: "Auto Peças Rota 8", contact: "Eduardo Lima", phone: "(11) 3311-2200", whatsapp: "(11) 92211-0099", email: "eduardo@rota8.com", city: "São Paulo", responsible: marina.id, createdAt: daysAgo(30), stage: "aguardando", origin: "Indicação", brand: [Brand.VERON], subs: { veron: true, arena360: true } },
    { company: "Grupo Hospitalar São Lucas", contact: "Dra. Camila Diniz", phone: "(11) 2288-9900", whatsapp: "(11) 91100-9988", email: "camila@saolucas.com.br", city: "São Bernardo", responsible: rafael.id, createdAt: daysAgo(40), stage: "fechado", origin: "Google Ads", brand: [Brand.ARENA360], subs: { veron: true, arena360: true }, favorite: true },
    { company: "Construtora Alicerce", contact: "Rodrigo Vieira", phone: "(11) 3355-7788", whatsapp: "(11) 90099-8877", email: "rodrigo@alicerce.eng.br", city: "Santo André", responsible: bruna.id, createdAt: daysAgo(45), stage: "fechado", origin: "Indicação", brand: [Brand.VERON], subs: { veron: true, arena360: true } },
    { company: "Boutique Alma", contact: "Juliana Prado", phone: "(11) 3366-8899", whatsapp: "(11) 98899-7766", email: "juliana@boutiquealma.com", city: "São Paulo", responsible: diego.id, createdAt: daysAgo(50), stage: "perdido", origin: "Instagram", brand: [Brand.ARENA360], subs: { veron: true, arena360: false } },
  ];

  let i = 0;
  for (const c of seedClients) {
    i++;
    const client = await prisma.client.create({
      data: {
        company: c.company,
        contactName: c.contact,
        phone: c.phone,
        whatsapp: c.whatsapp,
        email: c.email,
        city: c.city,
        brands: c.brand,
        origin: c.origin,
        favorite: (c as any).favorite || false,
        responsibleId: c.responsible,
        columnId: c.stage,
        position: i,
        createdAt: c.createdAt,
        subscriptions: {
          create: [
            { brand: Brand.VERON, subscribed: c.subs.veron },
            { brand: Brand.ARENA360, subscribed: c.subs.arena360 },
          ],
        },
      },
    });

    if (client.company === "Clínica VidaPlus") {
      await prisma.activity.createMany({
        data: [
          { clientId: client.id, type: ActivityType.LIGACAO, text: "Primeiro contato realizado, agendada demonstração.", userId: bruna.id, createdAt: daysAgo(6) },
          { clientId: client.id, type: ActivityType.OBSERVACAO, text: "Respondeu ao e-mail da Veron dizendo que não tem interesse no momento.", userId: bruna.id, createdAt: daysAgo(1) },
        ],
      });
    }
  }

  console.log("Seed concluído. Login de teste: marina@veronproducoes.com.br / veron@2026");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { subDays, addDays, setHours, setMinutes } from 'date-fns'

const prisma = new PrismaClient()

const PATIENTS = [
  { name: 'Ana Carolina Silva', phone: '5541999001001', email: 'ana.silva@email.com' },
  { name: 'João Pedro Santos', phone: '5541999001002', email: 'joao.santos@email.com' },
  { name: 'Maria Eduarda Costa', phone: '5541999001003' },
  { name: 'Pedro Henrique Oliveira', phone: '5541999001004', email: 'pedro.oliveira@email.com' },
  { name: 'Larissa Fernanda Lima', phone: '5541999001005' },
  { name: 'Rafael Augusto Pereira', phone: '5541999001006', email: 'rafael.pereira@email.com' },
  { name: 'Camila Regina Souza', phone: '5541999001007' },
  { name: 'Lucas Gabriel Martins', phone: '5541999001008', email: 'lucas.martins@email.com' },
  { name: 'Juliana Aparecida Rocha', phone: '5541999001009' },
  { name: 'Marcos Paulo Alves', phone: '5541999001010', email: 'marcos.alves@email.com' },
  { name: 'Fernanda Cristina Gomes', phone: '5541999001011' },
  { name: 'Thiago Eduardo Barbosa', phone: '5541999001012', email: 'thiago.barbosa@email.com' },
  { name: 'Priscila Santos Ferreira', phone: '5541999001013' },
  { name: 'Anderson Luis Cardoso', phone: '5541999001014' },
  { name: 'Vanessa Cristiane Lopes', phone: '5541999001015', email: 'vanessa.lopes@email.com' },
]

const PROCEDURES = [
  { name: 'Limpeza dental', value: 180 },
  { name: 'Consulta de avaliação', value: 150 },
  { name: 'Extração simples', value: 220 },
  { name: 'Restauração', value: 280 },
  { name: 'Clareamento dental', value: 600 },
  { name: 'Radiografia', value: 120 },
  { name: 'Tratamento de canal', value: 900 },
  { name: 'Ortodontia - consulta', value: 250 },
]

type AppointmentStatus = 'SCHEDULED' | 'CONFIRMED' | 'CANCELLED' | 'NO_SHOW' | 'COMPLETED'

const PAST_STATUSES: AppointmentStatus[] = ['COMPLETED', 'COMPLETED', 'COMPLETED', 'NO_SHOW', 'CANCELLED']
const FUTURE_STATUSES: AppointmentStatus[] = ['SCHEDULED', 'SCHEDULED', 'CONFIRMED', 'CONFIRMED', 'SCHEDULED']

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(arr.length * 0.5) % arr.length] ?? arr[0]!
}

function makeDateTime(daysOffset: number, hour: number, minute = 0): Date {
  const d = daysOffset >= 0 ? addDays(new Date(), daysOffset) : subDays(new Date(), -daysOffset)
  return setMinutes(setHours(d, hour), minute)
}

async function main() {
  console.log('🌱 Seeding ClinicFlow AI database...')

  await prisma.message.deleteMany()
  await prisma.reminder.deleteMany()
  await prisma.automation.deleteMany()
  await prisma.appointment.deleteMany()
  await prisma.patient.deleteMany()
  await prisma.messageTemplate.deleteMany()
  await prisma.user.deleteMany()
  await prisma.clinic.deleteMany()

  const hashedPassword = await bcrypt.hash('clinicflow123', 12)

  const clinic = await prisma.clinic.create({
    data: {
      name: 'Odontoclínica Silva',
      email: 'contato@odontoclinicasilva.com.br',
      phone: '(41) 3333-4444',
      specialty: 'Odontologia',
      plan: 'CLINIC',
      ticketMedio: 195,
      isActive: true,
      evolutionInstance: process.env.EVOLUTION_INSTANCE_NAME || 'clinicflow',
    },
  })

  await prisma.user.create({
    data: {
      name: 'Dr. Carlos Silva',
      email: 'carlos@odontoclinicasilva.com.br',
      password: hashedPassword,
      role: 'OWNER',
      clinicId: clinic.id,
    },
  })

  await prisma.user.create({
    data: {
      name: 'Recepcionista Ana',
      email: 'recepcao@odontoclinicasilva.com.br',
      password: hashedPassword,
      role: 'STAFF',
      clinicId: clinic.id,
    },
  })

  await prisma.user.create({
    data: {
      name: 'Dra. Beatriz Mendes',
      email: 'beatriz@odontoclinicasilva.com.br',
      password: hashedPassword,
      role: 'ADMIN',
      clinicId: clinic.id,
    },
  })

  const templates = await prisma.messageTemplate.createManyAndReturn({
    data: [
      {
        clinicId: clinic.id,
        name: 'Lembrete 48h',
        type: 'REMINDER',
        body: 'Olá {{nome_paciente}}! 😊 Sua consulta de {{procedimento}} está marcada para {{data_consulta}} na {{nome_clinica}}. Confirme respondendo SIM ou cancele respondendo NÃO. Qualquer dúvida, estamos aqui!',
      },
      {
        clinicId: clinic.id,
        name: 'Lembrete 2h',
        type: 'CONFIRMATION',
        body: '{{nome_paciente}}, lembrando que sua consulta começa em 2 horas! Às {{data_consulta}} na {{nome_clinica}}. Te esperamos! 😊',
      },
      {
        clinicId: clinic.id,
        name: 'Reativação',
        type: 'REACTIVATION',
        body: 'Olá {{nome_paciente}}! Sentimos sua falta na {{nome_clinica}} 💙 Faz um tempo que não nos vemos. Que tal agendar uma consulta? Responda AGENDAR e te ajudamos a encontrar o melhor horário!',
      },
      {
        clinicId: clinic.id,
        name: 'Pós-consulta',
        type: 'POST_VISIT',
        body: 'Olá {{nome_paciente}}! 😊 Obrigado pela sua visita à {{nome_clinica}}. Como foi sua experiência? Responda com uma nota de 1 a 5 para nos ajudar a melhorar!',
      },
    ],
  })

  const reminderTemplate = templates.find((t) => t.type === 'REMINDER')!
  const confirmTemplate = templates.find((t) => t.type === 'CONFIRMATION')!
  const reactivationTemplate = templates.find((t) => t.type === 'REACTIVATION')!
  const postVisitTemplate = templates.find((t) => t.type === 'POST_VISIT')!

  await prisma.automation.createMany({
    data: [
      {
        clinicId: clinic.id,
        name: 'Lembrete 48h antes',
        trigger: '48h_before',
        isActive: true,
        templateId: reminderTemplate.id,
      },
      {
        clinicId: clinic.id,
        name: 'Lembrete 2h antes',
        trigger: '2h_before',
        isActive: true,
        templateId: confirmTemplate.id,
      },
      {
        clinicId: clinic.id,
        name: 'Reativação de inativos',
        trigger: 'inactive_90_days',
        isActive: false,
        templateId: reactivationTemplate.id,
      },
      {
        clinicId: clinic.id,
        name: 'Pesquisa pós-consulta',
        trigger: 'post_visit_4h',
        isActive: true,
        templateId: postVisitTemplate.id,
      },
    ],
  })

  const patients = await Promise.all(
    PATIENTS.map((p, i) =>
      prisma.patient.create({
        data: {
          ...p,
          clinicId: clinic.id,
          lastVisit: i < 12 ? subDays(new Date(), i * 7 + 5) : subDays(new Date(), 95 + i * 3),
          totalVisits: Math.floor(Math.random() * 8) + 1,
          isActive: true,
        },
      })
    )
  )

  const SCHEDULE = [
    { days: -90, hour: 9, patIdx: 0, procIdx: 0, status: 'COMPLETED' as AppointmentStatus },
    { days: -85, hour: 10, patIdx: 1, procIdx: 1, status: 'COMPLETED' as AppointmentStatus },
    { days: -80, hour: 14, patIdx: 2, procIdx: 2, status: 'NO_SHOW' as AppointmentStatus },
    { days: -75, hour: 9, patIdx: 3, procIdx: 3, status: 'COMPLETED' as AppointmentStatus },
    { days: -70, hour: 11, patIdx: 4, procIdx: 4, status: 'COMPLETED' as AppointmentStatus },
    { days: -65, hour: 15, patIdx: 5, procIdx: 0, status: 'CANCELLED' as AppointmentStatus },
    { days: -60, hour: 8, patIdx: 6, procIdx: 1, status: 'COMPLETED' as AppointmentStatus },
    { days: -55, hour: 10, patIdx: 7, procIdx: 5, status: 'COMPLETED' as AppointmentStatus },
    { days: -50, hour: 14, patIdx: 8, procIdx: 6, status: 'NO_SHOW' as AppointmentStatus },
    { days: -45, hour: 9, patIdx: 9, procIdx: 0, status: 'COMPLETED' as AppointmentStatus },
    { days: -40, hour: 11, patIdx: 10, procIdx: 3, status: 'COMPLETED' as AppointmentStatus },
    { days: -35, hour: 16, patIdx: 11, procIdx: 1, status: 'COMPLETED' as AppointmentStatus },
    { days: -30, hour: 9, patIdx: 12, procIdx: 7, status: 'CANCELLED' as AppointmentStatus },
    { days: -25, hour: 10, patIdx: 13, procIdx: 0, status: 'COMPLETED' as AppointmentStatus },
    { days: -20, hour: 14, patIdx: 14, procIdx: 2, status: 'COMPLETED' as AppointmentStatus },
    { days: -15, hour: 9, patIdx: 0, procIdx: 1, status: 'COMPLETED' as AppointmentStatus },
    { days: -10, hour: 11, patIdx: 1, procIdx: 3, status: 'NO_SHOW' as AppointmentStatus },
    { days: -7, hour: 14, patIdx: 2, procIdx: 0, status: 'COMPLETED' as AppointmentStatus },
    { days: -5, hour: 9, patIdx: 3, procIdx: 4, status: 'COMPLETED' as AppointmentStatus },
    { days: -3, hour: 10, patIdx: 4, procIdx: 1, status: 'COMPLETED' as AppointmentStatus },
    { days: -1, hour: 15, patIdx: 5, procIdx: 0, status: 'CONFIRMED' as AppointmentStatus },
    { days: 0, hour: 9, patIdx: 6, procIdx: 1, status: 'CONFIRMED' as AppointmentStatus },
    { days: 0, hour: 10, patIdx: 7, procIdx: 3, status: 'SCHEDULED' as AppointmentStatus },
    { days: 0, hour: 14, patIdx: 8, procIdx: 0, status: 'CANCELLED' as AppointmentStatus },
    { days: 1, hour: 9, patIdx: 9, procIdx: 5, status: 'SCHEDULED' as AppointmentStatus },
    { days: 1, hour: 11, patIdx: 10, procIdx: 1, status: 'CONFIRMED' as AppointmentStatus },
    { days: 2, hour: 14, patIdx: 11, procIdx: 2, status: 'SCHEDULED' as AppointmentStatus },
    { days: 3, hour: 9, patIdx: 12, procIdx: 6, status: 'SCHEDULED' as AppointmentStatus },
    { days: 5, hour: 10, patIdx: 13, procIdx: 0, status: 'SCHEDULED' as AppointmentStatus },
    { days: 7, hour: 15, patIdx: 14, procIdx: 3, status: 'SCHEDULED' as AppointmentStatus },
  ]

  for (const s of SCHEDULE) {
    const proc = PROCEDURES[s.procIdx] ?? PROCEDURES[0]!
    const pat = patients[s.patIdx] ?? patients[0]!
    const scheduledAt = makeDateTime(s.days, s.hour)

    await prisma.appointment.create({
      data: {
        clinicId: clinic.id,
        patientId: pat.id,
        scheduledAt,
        duration: 30,
        procedure: proc.name,
        value: proc.value,
        status: s.status,
      },
    })
  }

  console.log('✅ Seed completed!')
  console.log(`   Clinic: ${clinic.name}`)
  console.log(`   Login: carlos@odontoclinicasilva.com.br / clinicflow123`)
  console.log(`   Patients: ${patients.length}`)
  console.log(`   Appointments: ${SCHEDULE.length}`)
  console.log(`   Templates: 4`)
  console.log(`   Automations: 4`)
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    prisma.$disconnect()
    process.exit(1)
  })

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const nigerianSchools = [
  'Nigerian Army University Biu Borno State',
  'University of Lagos',
  'Ahmadu Bello University',
  'University of Ibadan',
  'University of Nigeria, Nsukka',
  'Obafemi Awolowo University',
  'University of Benin',
  'University of Port Harcourt',
  'Federal University of Technology, Akure',
  'Federal University of Technology, Minna',
  'Federal University of Technology, Owerri',
  'University of Calabar',
  'University of Jos',
  'University of Maiduguri',
  'Bayero University Kano',
  'University of Abuja',
  'Nnamdi Azikiwe University',
  'Lagos State University',
  'Rivers State University',
  'Delta State University',
  'Ambrose Alli University',
  'Enugu State University of Science and Technology',
  'Kaduna State University',
  'Kano State University of Science and Technology',
  'Kwara State University',
  'Olabisi Onabanjo University',
  'Osun State University',
  'Plateau State University',
  'Sokoto State University',
  'Yobe State University',
]

async function seedSchools() {
  console.log('🌱 Seeding Nigerian schools...')

  for (const schoolName of nigerianSchools) {
    try {
      await prisma.school.upsert({
        where: { name: schoolName },
        update: {},
        create: { name: schoolName },
      })
      console.log(`✅ Added: ${schoolName}`)
    } catch (error: any) {
      console.error(`❌ Failed to add ${schoolName}:`, error.message)
    }
  }

  console.log('✅ Seeding completed!')
}

seedSchools()
  .catch((error) => {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


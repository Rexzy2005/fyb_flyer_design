import { PrismaClient } from '@prisma/client'
import { mockTemplates } from '../lib/mock-data'

const db = new PrismaClient()

async function seedTemplates() {
  try {
    console.log('🌱 Starting template seeding...')

    for (const template of mockTemplates) {
      // Check if template already exists
      const existing = await db.template.findUnique({
        where: { id: template.id },
      })

      if (existing) {
        console.log(`✓ Template ${template.id} already exists`)
        continue
      }

      // Create template
      const created = await db.template.create({
        data: {
          id: template.id,
          name: template.name,
          category: template.category.toUpperCase() as any,
          fields: JSON.stringify(template.fields),
          canvasConfig: JSON.stringify(template.canvasConfig),
          status: 'PUBLISHED',
          previewImage: template.previewImage,
          usageCount: template.usageCount || 0,
        },
      })

      console.log(`✓ Created template: ${created.id} - ${created.name}`)
    }

    console.log('✅ Template seeding completed!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Seeding error:', error)
    process.exit(1)
  }
}

seedTemplates()

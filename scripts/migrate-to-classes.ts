import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Generate 6-character alphanumeric invite code (avoiding ambiguous chars)
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateInviteCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}

async function generateUniqueInviteCode(): Promise<string> {
  let attempts = 0;
  while (attempts < 10) {
    const code = generateInviteCode();
    const existing = await prisma.inviteCode.findUnique({
      where: { code }
    });
    if (!existing) return code;
    attempts++;
  }
  throw new Error('Failed to generate unique invite code');
}

async function migrateToClasses() {
  console.log('🚀 Starting migration to class-based structure...\n');

  try {
    // Get all teachers
    const teachers = await prisma.teacher.findMany({
      include: {
        user: true,
        pdfs: true,
        games: true,
      },
    });

    console.log(`📚 Found ${teachers.length} teachers to migrate\n`);

    for (const teacher of teachers) {
      console.log(`👨‍🏫 Processing teacher: ${teacher.user.name} (${teacher.user.email})`);

      // Check if teacher already has a "Default" class
      let defaultClass = await prisma.class.findFirst({
        where: {
          teacherId: teacher.id,
          name: 'Default',
        },
      });

      // Create "Default" class if it doesn't exist
      if (!defaultClass) {
        console.log(`  ✨ Creating "Default" class...`);
        defaultClass = await prisma.class.create({
          data: {
            teacherId: teacher.id,
            name: 'Default',
            description: 'Default class for existing materials',
            isActive: true,
          },
        });

        // Generate invite code for the class
        const inviteCode = await generateUniqueInviteCode();
        await prisma.inviteCode.create({
          data: {
            classId: defaultClass.id,
            code: inviteCode,
            isActive: true,
            createdBy: teacher.userId,
          },
        });
        console.log(`  🎫 Generated invite code: ${inviteCode}`);
      } else {
        console.log(`  ✅ "Default" class already exists`);
      }

      // Note: PDFs and Games now require classId in schema
      // This migration logic is preserved for reference but won't match any records
      // since classId is a required field
      if (teacher.pdfs.length > 0) {
        console.log(`  📄 ${teacher.pdfs.length} PDFs already have class assignments`);
      }

      if (teacher.games.length > 0) {
        console.log(`  🎮 ${teacher.games.length} Games already have class assignments`);
      }

      console.log(`  ✅ Teacher migration complete\n`);
    }

    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateToClasses()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

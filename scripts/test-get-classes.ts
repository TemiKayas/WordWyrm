import { db } from '../lib/db';

async function testGetClasses() {
  try {
    console.log('Testing getTeacherClasses logic...\n');

    // Get a teacher user to test with
    const teacherUser = await db.user.findFirst({
      where: { role: 'TEACHER' },
    });

    if (!teacherUser) {
      console.log('❌ No teacher users found');
      return;
    }

    console.log(`Testing with teacher: ${teacherUser.name} (${teacherUser.email})`);
    console.log(`User ID: ${teacherUser.id}\n`);

    // Get teacher profile
    const teacher = await db.teacher.findUnique({
      where: { userId: teacherUser.id },
    });

    if (!teacher) {
      console.log('❌ Teacher profile not found for this user');
      return;
    }

    console.log(`✓ Teacher profile found: ${teacher.id}\n`);

    // Try to get classes with the same query as getTeacherClasses
    console.log('Attempting to fetch classes...');
    const classes = await db.class.findMany({
      where: { teacherId: teacher.id },
      include: {
        _count: {
          select: {
            memberships: true,
            pdfs: true,
            games: true,
          },
        },
        inviteCodes: {
          where: { isActive: true },
          select: {
            code: true,
            isActive: true,
          },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log(`✓ Successfully fetched ${classes.length} classes\n`);

    if (classes.length > 0) {
      console.log('Classes:');
      classes.forEach((cls, index) => {
        console.log(`\n  ${index + 1}. ${cls.name}`);
        console.log(`     ID: ${cls.id}`);
        console.log(`     Students: ${cls._count.memberships}`);
        console.log(`     PDFs: ${cls._count.pdfs}`);
        console.log(`     Games: ${cls._count.games}`);
        console.log(`     Active invite codes: ${cls.inviteCodes.length}`);
        if (cls.inviteCodes.length > 0) {
          console.log(`     Invite code: ${cls.inviteCodes[0].code}`);
        }
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
    if (error instanceof Error) {
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
    }
  } finally {
    await db.$disconnect();
  }
}

testGetClasses();

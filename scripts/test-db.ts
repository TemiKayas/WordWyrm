import { db } from '../lib/db';

async function testDatabase() {
  try {
    console.log('Testing database connection...');

    // Test 1: Check connection
    const userCount = await db.user.count();
    console.log(`✓ Database connected. Total users: ${userCount}`);

    // Test 2: Check teachers
    const teacherCount = await db.teacher.count();
    console.log(`✓ Total teachers: ${teacherCount}`);

    // Test 3: List all users with their roles
    const users = await db.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });
    console.log('\nUsers:');
    users.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - Role: ${user.role}`);
    });

    // Test 4: Check teacher profiles
    const teachers = await db.teacher.findMany({
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });
    console.log('\nTeacher profiles:');
    if (teachers.length === 0) {
      console.log('  ⚠️  No teacher profiles found!');
    } else {
      teachers.forEach(teacher => {
        console.log(`  - ${teacher.user.name} (${teacher.user.email})`);
        console.log(`    Teacher ID: ${teacher.id}`);
        console.log(`    User ID: ${teacher.userId}`);
      });
    }

    // Test 5: Check classes
    const classCount = await db.class.count();
    console.log(`\nTotal classes: ${classCount}`);

  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    await db.$disconnect();
  }
}

testDatabase();

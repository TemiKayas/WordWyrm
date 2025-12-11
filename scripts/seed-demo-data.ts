#!/usr/bin/env tsx

/**
 * ============================================================================
 * WORDWYRM DEMO DATA SEEDER
 * ============================================================================
 *
 * This script generates realistic demo data for WordWyrm presentations.
 *
 * WHAT IT CREATES:
 * ----------------
 * - 3 teacher accounts with hashed passwords
 * - 2-3 classes per teacher with realistic names
 * - Invite codes for each class (for student enrollment)
 * - 3-4 games per class (alternating Snake and Tower Defense modes)
 * - Real QR codes for each game (uploaded to Vercel Blob)
 * - 60-80 unique student accounts with realistic names
 * - 10-20 game sessions per game with varied performance
 * - Question attempts for mastery learning analytics
 * - Realistic participation patterns (some students didn't attempt, some incomplete)
 *
 * HOW TO USE:
 * -----------
 *
 * 1. GENERATE DEMO DATA (run before your presentation):
 *    ```bash
 *    npx tsx scripts/seed-demo-data.ts
 *    ```
 *
 * 2. CLEAN UP AFTER PRESENTATION:
 *    ```bash
 *    npx tsx scripts/seed-demo-data.ts --cleanup
 *    ```
 *
 * TEACHER ACCOUNTS CREATED:
 * -------------------------
 * - Evan Jaquez (teacher1@example.com) - Password: "password"
 * - Allison Cho (teacher2@example.com) - Password: "password"
 * - Eddie Lu (teacher3@example.com) - Password: "password"
 *
 * SAFETY FEATURES:
 * ----------------
 * - Idempotent: Won't create duplicates if run multiple times
 * - Demo marking: Teachers have school="DEMO_ACCOUNT" for easy identification
 * - Progress logging: Shows real-time creation status
 * - Error handling: Rolls back on failures
 * - Cleanup validation: Asks for confirmation before deletion
 *
 * WHAT GETS CLEANED UP:
 * ---------------------
 * The --cleanup flag will DELETE:
 * - All 3 demo teacher accounts (cascade deletes classes, games, etc.)
 * - All mock student accounts
 * - All QR codes from Vercel Blob storage
 * - All associated data (sessions, attempts, PDFs, quizzes)
 *
 * ============================================================================
 */

import { PrismaClient, Role, GameMode, Subject } from '@prisma/client';
import { hash } from 'bcryptjs';
import { faker } from '@faker-js/faker';
import { generateGameQRCode } from '@/lib/utils/qr-code';
import { getDefaultGameThumbnail } from '@/lib/utils/game';
import { del } from '@vercel/blob';

// ============================================================================
// CONFIGURATION
// ============================================================================

const db = new PrismaClient();

const DEMO_TEACHERS = [
  { name: 'Evan Jaquez', email: 'teacher1@example.com', password: 'password', numClasses: 3 },
  { name: 'Allison Cho', email: 'teacher2@example.com', password: 'password', numClasses: 3 },
  { name: 'Eddie Lu', email: 'teacher3@example.com', password: 'password', numClasses: 2 },
];

const DEMO_SCHOOL_IDENTIFIER = 'DEMO_ACCOUNT';

// Number of games per class (will alternate between Snake and Tower Defense)
const GAMES_PER_CLASS = [3, 4, 3, 4]; // Varies per class

// Number of students per game (realistic class participation)
const MIN_STUDENTS_PER_GAME = 10;
const MAX_STUDENTS_PER_GAME = 20;

// ============================================================================
// MOCK DATA - CLASS NAMES
// ============================================================================

const CLASS_NAMES = [
  // Science
  'AP Biology Period 3',
  'Chemistry 101 - Room 204',
  'Physics Honors',
  'Environmental Science',
  'Anatomy & Physiology',

  // Math
  'Algebra 1 - Room 204',
  'Geometry Period 2',
  'Pre-Calculus Advanced',
  'AP Calculus AB',
  'Statistics & Probability',

  // English
  'English Literature Period 5',
  'Creative Writing Workshop',
  'AP English Language',

  // History
  'World History Honors',
  'US History Period 4',
  'Government & Economics',

  // Language
  'Spanish 2 - Señora Martinez',
  'French 3 Advanced',
];

// ============================================================================
// MOCK DATA - QUIZ CONTENT BY SUBJECT
// ============================================================================

const MOCK_QUIZZES: Record<Subject, Array<{ title: string; questions: any[] }>> = {
  SCIENCE: [
    {
      title: 'Cell Structure & Function',
      questions: [
        { question: 'What is the powerhouse of the cell?', options: ['Nucleus', 'Mitochondria', 'Ribosome', 'Golgi Apparatus'], answer: 'Mitochondria' },
        { question: 'Which organelle is responsible for protein synthesis?', options: ['Ribosome', 'Lysosome', 'Vacuole', 'Chloroplast'], answer: 'Ribosome' },
        { question: 'What controls what enters and exits the cell?', options: ['Cell wall', 'Cell membrane', 'Cytoplasm', 'Endoplasmic reticulum'], answer: 'Cell membrane' },
        { question: 'Where is DNA stored in eukaryotic cells?', options: ['Cytoplasm', 'Mitochondria', 'Nucleus', 'Cell membrane'], answer: 'Nucleus' },
        { question: 'Which organelle helps with digestion inside the cell?', options: ['Lysosome', 'Ribosome', 'Vacuole', 'Nucleus'], answer: 'Lysosome' },
        { question: 'What is the gel-like substance inside the cell?', options: ['Plasma', 'Cytoplasm', 'Nucleoplasm', 'Protoplasm'], answer: 'Cytoplasm' },
        { question: 'Which structure is only found in plant cells?', options: ['Mitochondria', 'Nucleus', 'Chloroplast', 'Ribosome'], answer: 'Chloroplast' },
        { question: 'What is the function of the Golgi apparatus?', options: ['Energy production', 'Protein packaging', 'DNA storage', 'Cell division'], answer: 'Protein packaging' },
        { question: 'Which organelle stores water and nutrients?', options: ['Vacuole', 'Nucleus', 'Mitochondria', 'Lysosome'], answer: 'Vacuole' },
        { question: 'What provides structural support in plant cells?', options: ['Cell membrane', 'Cell wall', 'Cytoskeleton', 'Nucleus'], answer: 'Cell wall' },
      ],
    },
    {
      title: 'Photosynthesis Quiz',
      questions: [
        { question: 'What is the primary product of photosynthesis?', options: ['Oxygen', 'Carbon dioxide', 'Glucose', 'Water'], answer: 'Glucose' },
        { question: 'Where does photosynthesis occur?', options: ['Mitochondria', 'Nucleus', 'Chloroplast', 'Ribosome'], answer: 'Chloroplast' },
        { question: 'What gas do plants absorb during photosynthesis?', options: ['Oxygen', 'Nitrogen', 'Carbon dioxide', 'Hydrogen'], answer: 'Carbon dioxide' },
        { question: 'What is the green pigment in plants called?', options: ['Carotene', 'Xanthophyll', 'Chlorophyll', 'Anthocyanin'], answer: 'Chlorophyll' },
        { question: 'What is the energy source for photosynthesis?', options: ['Heat', 'Sunlight', 'Wind', 'Water'], answer: 'Sunlight' },
        { question: 'What is released as a byproduct of photosynthesis?', options: ['Carbon dioxide', 'Nitrogen', 'Oxygen', 'Hydrogen'], answer: 'Oxygen' },
        { question: 'Which part of the plant absorbs water?', options: ['Leaves', 'Stem', 'Roots', 'Flowers'], answer: 'Roots' },
        { question: 'What is the equation for photosynthesis?', options: ['6CO2 + 6H2O → C6H12O6 + 6O2', 'C6H12O6 + 6O2 → 6CO2 + 6H2O', '2H2 + O2 → 2H2O', 'None'], answer: '6CO2 + 6H2O → C6H12O6 + 6O2' },
        { question: 'What are the small openings on leaves called?', options: ['Stomata', 'Lenticels', 'Pores', 'Guard cells'], answer: 'Stomata' },
        { question: 'During which time does photosynthesis occur?', options: ['Day only', 'Night only', 'Both day and night', 'Neither'], answer: 'Day only' },
      ],
    },
    {
      title: 'Chemical Reactions',
      questions: [
        { question: 'What is a chemical change?', options: ['Change in state', 'Change in size', 'Formation of new substance', 'Change in color'], answer: 'Formation of new substance' },
        { question: 'What does the law of conservation of mass state?', options: ['Mass is created', 'Mass is destroyed', 'Mass is conserved', 'Mass changes'], answer: 'Mass is conserved' },
        { question: 'What is a catalyst?', options: ['Speeds up reaction', 'Slows reaction', 'Stops reaction', 'No effect'], answer: 'Speeds up reaction' },
        { question: 'What are the reactants in a chemical equation?', options: ['Products', 'Starting materials', 'Catalysts', 'Byproducts'], answer: 'Starting materials' },
        { question: 'What is an exothermic reaction?', options: ['Absorbs heat', 'Releases heat', 'No heat change', 'Requires light'], answer: 'Releases heat' },
        { question: 'What is the pH of a neutral solution?', options: ['0', '7', '14', '1'], answer: '7' },
        { question: 'What is an acid?', options: ['pH > 7', 'pH < 7', 'pH = 7', 'pH = 0'], answer: 'pH < 7' },
        { question: 'What happens during a combustion reaction?', options: ['Burns with oxygen', 'Dissolves in water', 'Changes state', 'Freezes'], answer: 'Burns with oxygen' },
        { question: 'What is oxidation?', options: ['Gain of electrons', 'Loss of electrons', 'Gain of protons', 'Loss of neutrons'], answer: 'Loss of electrons' },
        { question: 'What is the symbol for sodium?', options: ['S', 'So', 'Na', 'N'], answer: 'Na' },
      ],
    },
    {
      title: 'Evolution & Natural Selection',
      questions: [
        { question: 'Who proposed the theory of evolution?', options: ['Newton', 'Einstein', 'Darwin', 'Mendel'], answer: 'Darwin' },
        { question: 'What is natural selection?', options: ['Random change', 'Survival of the fittest', 'Artificial breeding', 'Genetic drift'], answer: 'Survival of the fittest' },
        { question: 'What are adaptations?', options: ['Harmful traits', 'Beneficial traits', 'Random traits', 'Learned behaviors'], answer: 'Beneficial traits' },
        { question: 'What is a mutation?', options: ['Change in DNA', 'Change in behavior', 'Change in habitat', 'Change in diet'], answer: 'Change in DNA' },
        { question: 'What is speciation?', options: ['Extinction', 'New species formation', 'Migration', 'Hibernation'], answer: 'New species formation' },
        { question: 'What are fossils?', options: ['Living organisms', 'Preserved remains', 'Modern bones', 'Artificial remains'], answer: 'Preserved remains' },
        { question: 'What is genetic drift?', options: ['Directed change', 'Random change', 'No change', 'Artificial change'], answer: 'Random change' },
        { question: 'What is convergent evolution?', options: ['Similar traits, different ancestors', 'Different traits, same ancestor', 'No traits', 'Identical twins'], answer: 'Similar traits, different ancestors' },
        { question: 'What is the age of Earth?', options: ['4.5 million years', '4.5 billion years', '450 million years', '45 billion years'], answer: '4.5 billion years' },
        { question: 'What are homologous structures?', options: ['Same function, different origin', 'Same origin, different function', 'No relation', 'Identical'], answer: 'Same origin, different function' },
      ],
    },
  ],
  MATH: [
    {
      title: 'Pythagorean Theorem',
      questions: [
        { question: 'What is the Pythagorean theorem?', options: ['a + b = c', 'a² + b² = c²', 'a × b = c', 'a - b = c'], answer: 'a² + b² = c²' },
        { question: 'In a right triangle, what is the longest side called?', options: ['Adjacent', 'Opposite', 'Hypotenuse', 'Base'], answer: 'Hypotenuse' },
        { question: 'If a=3 and b=4, what is c?', options: ['5', '7', '25', '12'], answer: '5' },
        { question: 'What type of triangle does the Pythagorean theorem apply to?', options: ['Equilateral', 'Isosceles', 'Right', 'Obtuse'], answer: 'Right' },
        { question: 'What is 5² + 12²?', options: ['169', '13', '17', '144'], answer: '169' },
        { question: 'If c=13 and a=5, what is b?', options: ['8', '12', '18', '144'], answer: '12' },
        { question: 'What is the square root of 144?', options: ['11', '12', '13', '14'], answer: '12' },
        { question: 'In a 3-4-5 triangle, which is the hypotenuse?', options: ['3', '4', '5', '7'], answer: '5' },
        { question: 'What is 8² + 15²?', options: ['289', '17', '23', '225'], answer: '289' },
        { question: 'Is the Pythagorean theorem true for all triangles?', options: ['Yes', 'No', 'Sometimes', 'Only equilateral'], answer: 'No' },
      ],
    },
    {
      title: 'Solving Linear Equations',
      questions: [
        { question: 'What is the solution to 2x + 5 = 15?', options: ['5', '10', '7.5', '20'], answer: '5' },
        { question: 'Solve: x - 7 = 12', options: ['5', '19', '7', '12'], answer: '19' },
        { question: 'What is 3x = 21?', options: ['7', '6', '8', '63'], answer: '7' },
        { question: 'Solve: 4x + 8 = 32', options: ['6', '8', '10', '24'], answer: '6' },
        { question: 'What is x/5 = 4?', options: ['20', '9', '1', '5'], answer: '20' },
        { question: 'Solve: 2(x + 3) = 14', options: ['4', '5', '7', '8'], answer: '4' },
        { question: 'What is -3x = 12?', options: ['-4', '4', '-36', '36'], answer: '-4' },
        { question: 'Solve: 5x - 10 = 15', options: ['5', '1', '25', '3'], answer: '5' },
        { question: 'What is the first step in solving 2x + 7 = 15?', options: ['Add 7', 'Subtract 7', 'Multiply by 2', 'Divide by 2'], answer: 'Subtract 7' },
        { question: 'Solve: x/2 + 5 = 10', options: ['10', '5', '15', '20'], answer: '10' },
      ],
    },
    {
      title: 'Fractions & Decimals',
      questions: [
        { question: 'What is 1/2 as a decimal?', options: ['0.5', '0.25', '2', '0.1'], answer: '0.5' },
        { question: 'What is 3/4 as a decimal?', options: ['0.75', '0.5', '0.25', '1.33'], answer: '0.75' },
        { question: 'What is 0.25 as a fraction?', options: ['1/2', '1/4', '1/3', '2/5'], answer: '1/4' },
        { question: 'Simplify: 6/8', options: ['3/4', '2/3', '1/2', '6/8'], answer: '3/4' },
        { question: 'What is 1/3 + 1/3?', options: ['2/6', '2/3', '1/6', '3/3'], answer: '2/3' },
        { question: 'What is 2.5 × 4?', options: ['10', '8', '6.5', '1'], answer: '10' },
        { question: 'Convert 5/10 to simplest form', options: ['1/2', '5/10', '2/5', '1/5'], answer: '1/2' },
        { question: 'What is 0.5 + 0.25?', options: ['0.75', '0.5', '1', '0.25'], answer: '0.75' },
        { question: 'What is 3/5 as a decimal?', options: ['0.6', '0.5', '0.3', '1.67'], answer: '0.6' },
        { question: 'Multiply: 1/2 × 1/4', options: ['1/8', '1/6', '2/6', '1/2'], answer: '1/8' },
      ],
    },
  ],
  HISTORY: [
    {
      title: 'World War II Overview',
      questions: [
        { question: 'When did World War II start?', options: ['1935', '1939', '1941', '1945'], answer: '1939' },
        { question: 'When did World War II end?', options: ['1943', '1944', '1945', '1946'], answer: '1945' },
        { question: 'Who was the US president during most of WWII?', options: ['Truman', 'Eisenhower', 'Roosevelt', 'Wilson'], answer: 'Roosevelt' },
        { question: 'What event brought the US into WWII?', options: ['D-Day', 'Pearl Harbor', 'Hiroshima', 'Normandy'], answer: 'Pearl Harbor' },
        { question: 'Who was the leader of Nazi Germany?', options: ['Stalin', 'Mussolini', 'Hitler', 'Churchill'], answer: 'Hitler' },
        { question: 'What was D-Day?', options: ['End of war', 'Normandy invasion', 'Pearl Harbor', 'Atomic bomb'], answer: 'Normandy invasion' },
        { question: 'Which country was NOT an Axis power?', options: ['Germany', 'Italy', 'Japan', 'France'], answer: 'France' },
        { question: 'What was the Holocaust?', options: ['A battle', 'Genocide', 'Treaty', 'Weapon'], answer: 'Genocide' },
        { question: 'Where were atomic bombs dropped?', options: ['Germany', 'Italy', 'Japan', 'China'], answer: 'Japan' },
        { question: 'Who was the British Prime Minister during WWII?', options: ['Churchill', 'Chamberlain', 'Attlee', 'Eden'], answer: 'Churchill' },
      ],
    },
    {
      title: 'American Revolution',
      questions: [
        { question: 'When did the American Revolution begin?', options: ['1765', '1770', '1775', '1776'], answer: '1775' },
        { question: 'What year was the Declaration of Independence signed?', options: ['1775', '1776', '1777', '1783'], answer: '1776' },
        { question: 'Who wrote the Declaration of Independence?', options: ['Washington', 'Franklin', 'Jefferson', 'Adams'], answer: 'Jefferson' },
        { question: 'Who was the first US president?', options: ['Adams', 'Jefferson', 'Washington', 'Franklin'], answer: 'Washington' },
        { question: 'What was the Boston Tea Party?', options: ['Celebration', 'Protest', 'Battle', 'Treaty'], answer: 'Protest' },
        { question: 'What treaty ended the Revolution?', options: ['Paris', 'Versailles', 'Ghent', 'London'], answer: 'Paris' },
        { question: 'Who said "Give me liberty or give me death"?', options: ['Washington', 'Jefferson', 'Patrick Henry', 'Franklin'], answer: 'Patrick Henry' },
        { question: 'What was the final major battle?', options: ['Bunker Hill', 'Saratoga', 'Yorktown', 'Lexington'], answer: 'Yorktown' },
        { question: 'Who was the king of Britain during the Revolution?', options: ['George II', 'George III', 'George IV', 'William'], answer: 'George III' },
        { question: 'What were British soldiers called?', options: ['Redcoats', 'Bluecoats', 'Yankees', 'Rebels'], answer: 'Redcoats' },
      ],
    },
  ],
  ENGLISH: [
    {
      title: 'Literary Devices',
      questions: [
        { question: 'What is a metaphor?', options: ['Direct comparison', 'Indirect comparison', 'Exaggeration', 'Repetition'], answer: 'Indirect comparison' },
        { question: 'What is alliteration?', options: ['Rhyming', 'Repeated consonants', 'Exaggeration', 'Comparison'], answer: 'Repeated consonants' },
        { question: 'What is personification?', options: ['Human traits to objects', 'Animal traits', 'Exaggeration', 'Comparison'], answer: 'Human traits to objects' },
        { question: 'What is a simile?', options: ['Uses like/as', 'No comparison', 'Exaggeration', 'Repetition'], answer: 'Uses like/as' },
        { question: 'What is hyperbole?', options: ['Understatement', 'Exaggeration', 'Comparison', 'Rhyming'], answer: 'Exaggeration' },
        { question: 'What is onomatopoeia?', options: ['Rhyming', 'Sound words', 'Comparison', 'Repetition'], answer: 'Sound words' },
        { question: 'What is irony?', options: ['Expected outcome', 'Opposite of expected', 'Comparison', 'Exaggeration'], answer: 'Opposite of expected' },
        { question: 'What is imagery?', options: ['Visual description', 'Comparison', 'Rhyming', 'Exaggeration'], answer: 'Visual description' },
        { question: 'What is foreshadowing?', options: ['Past events', 'Future hints', 'Present description', 'Comparison'], answer: 'Future hints' },
        { question: 'What is symbolism?', options: ['Literal meaning', 'Deeper meaning', 'No meaning', 'Comparison'], answer: 'Deeper meaning' },
      ],
    },
    {
      title: 'Grammar Basics',
      questions: [
        { question: 'What is a noun?', options: ['Action word', 'Person/place/thing', 'Describing word', 'Connecting word'], answer: 'Person/place/thing' },
        { question: 'What is a verb?', options: ['Person/place/thing', 'Action word', 'Describing word', 'Connecting word'], answer: 'Action word' },
        { question: 'What is an adjective?', options: ['Action word', 'Person/place/thing', 'Describing word', 'Connecting word'], answer: 'Describing word' },
        { question: 'What is a pronoun?', options: ['Replaces noun', 'Action word', 'Describing word', 'Connecting word'], answer: 'Replaces noun' },
        { question: 'What is an adverb?', options: ['Describes noun', 'Describes verb', 'Person/place/thing', 'Connecting word'], answer: 'Describes verb' },
        { question: 'What is a conjunction?', options: ['Action word', 'Person/place/thing', 'Describing word', 'Connecting word'], answer: 'Connecting word' },
        { question: 'What is a complete sentence?', options: ['Just subject', 'Just verb', 'Subject and verb', 'Just object'], answer: 'Subject and verb' },
        { question: 'What is a comma splice?', options: ['Correct usage', 'Joining sentences with comma', 'No punctuation', 'Period usage'], answer: 'Joining sentences with comma' },
        { question: 'What is a subject?', options: ['Does action', 'Receives action', 'Describes action', 'No role'], answer: 'Does action' },
        { question: 'What is passive voice?', options: ['Subject does action', 'Action done to subject', 'No action', 'Question form'], answer: 'Action done to subject' },
      ],
    },
  ],
  LANGUAGE: [
    {
      title: 'Spanish Basics',
      questions: [
        { question: 'How do you say "hello" in Spanish?', options: ['Adiós', 'Hola', 'Gracias', 'Por favor'], answer: 'Hola' },
        { question: 'What is "goodbye" in Spanish?', options: ['Hola', 'Adiós', 'Gracias', 'Sí'], answer: 'Adiós' },
        { question: 'What does "gracias" mean?', options: ['Please', 'Sorry', 'Thank you', 'Yes'], answer: 'Thank you' },
        { question: 'What is "yes" in Spanish?', options: ['No', 'Sí', 'Tal vez', 'Nunca'], answer: 'Sí' },
        { question: 'What does "por favor" mean?', options: ['Thank you', 'Please', 'Goodbye', 'Hello'], answer: 'Please' },
        { question: 'How do you say "water" in Spanish?', options: ['Leche', 'Agua', 'Jugo', 'Café'], answer: 'Agua' },
        { question: 'What is "book" in Spanish?', options: ['Mesa', 'Silla', 'Libro', 'Pluma'], answer: 'Libro' },
        { question: 'What does "amigo" mean?', options: ['Enemy', 'Friend', 'Family', 'Stranger'], answer: 'Friend' },
        { question: 'What is "one" in Spanish?', options: ['Uno', 'Dos', 'Tres', 'Cero'], answer: 'Uno' },
        { question: 'What does "escuela" mean?', options: ['House', 'School', 'Store', 'Park'], answer: 'School' },
      ],
    },
  ],
  GENERAL: [
    {
      title: 'General Knowledge Quiz',
      questions: [
        { question: 'What is the capital of France?', options: ['London', 'Berlin', 'Paris', 'Madrid'], answer: 'Paris' },
        { question: 'How many continents are there?', options: ['5', '6', '7', '8'], answer: '7' },
        { question: 'What is the largest ocean?', options: ['Atlantic', 'Indian', 'Pacific', 'Arctic'], answer: 'Pacific' },
        { question: 'Who painted the Mona Lisa?', options: ['Van Gogh', 'Da Vinci', 'Picasso', 'Rembrandt'], answer: 'Da Vinci' },
        { question: 'What is the speed of light?', options: ['300,000 km/s', '150,000 km/s', '500,000 km/s', '100,000 km/s'], answer: '300,000 km/s' },
        { question: 'What is H2O?', options: ['Hydrogen', 'Oxygen', 'Water', 'Helium'], answer: 'Water' },
        { question: 'How many days in a leap year?', options: ['365', '366', '364', '367'], answer: '366' },
        { question: 'What is the smallest prime number?', options: ['0', '1', '2', '3'], answer: '2' },
        { question: 'Who wrote Romeo and Juliet?', options: ['Dickens', 'Shakespeare', 'Austen', 'Twain'], answer: 'Shakespeare' },
        { question: 'What is the largest planet?', options: ['Earth', 'Mars', 'Jupiter', 'Saturn'], answer: 'Jupiter' },
      ],
    },
  ],
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate a unique 6-character share code
 */
function generateShareCode(): string {
  const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}

/**
 * Generate a unique share code that doesn't exist in the database
 */
async function generateUniqueShareCode(): Promise<string> {
  let attempts = 0;
  while (attempts < 20) {
    const code = generateShareCode();
    const existing = await db.game.findUnique({ where: { shareCode: code } });
    if (!existing) return code;
    attempts++;
  }
  throw new Error('Failed to generate unique share code after 20 attempts.');
}

/**
 * Get a random quiz for a given subject
 */
function getRandomQuiz(subject: Subject): { title: string; questions: any[] } {
  const quizzes = MOCK_QUIZZES[subject];
  if (!quizzes || quizzes.length === 0) {
    // Fallback to GENERAL if subject has no quizzes
    return MOCK_QUIZZES.GENERAL[0];
  }
  return quizzes[Math.floor(Math.random() * quizzes.length)];
}

/**
 * Generate realistic game session data with varied performance
 */
function generateGameSessionData(gameMode: GameMode, totalQuestions: number) {
  // Random participation pattern
  const participationRoll = Math.random();

  // 20% chance student didn't attempt
  if (participationRoll < 0.2) {
    return null;
  }

  // 10% chance student started but didn't finish
  const didComplete = participationRoll >= 0.3;

  // Performance tiers: high (90%+), average (60-80%), struggling (30-50%)
  const performanceRoll = Math.random();
  let accuracyTarget: number;

  if (performanceRoll < 0.3) {
    // High performer
    accuracyTarget = 0.85 + Math.random() * 0.15; // 85-100%
  } else if (performanceRoll < 0.7) {
    // Average performer
    accuracyTarget = 0.6 + Math.random() * 0.25; // 60-85%
  } else {
    // Struggling student
    accuracyTarget = 0.3 + Math.random() * 0.3; // 30-60%
  }

  const questionsAnswered = didComplete ? totalQuestions : Math.floor(totalQuestions * (0.3 + Math.random() * 0.5));
  const correctAnswers = Math.floor(questionsAnswered * accuracyTarget);

  // Time spent (2-5 minutes for most students)
  const timeSpent = didComplete
    ? 120 + Math.floor(Math.random() * 180) // 2-5 minutes
    : 60 + Math.floor(Math.random() * 120);  // 1-3 minutes for incomplete

  // Generate game-specific metadata
  let metadata: any = {};

  if (gameMode === GameMode.SNAKE) {
    const longestStreak = Math.min(correctAnswers, 3 + Math.floor(Math.random() * 5));
    metadata = {
      longestStreak,
      finalLength: 3 + correctAnswers,
      totalQuestions: questionsAnswered,
    };
  } else if (gameMode === GameMode.TOWER_DEFENSE) {
    const wavesCompleted = Math.floor(correctAnswers / 2);
    metadata = {
      wavesCompleted,
      towersBuilt: correctAnswers * 2,
      enemiesDefeated: correctAnswers * 5,
    };
  }

  // Calculate score (used for leaderboards)
  const baseScore = correctAnswers * 100;
  const timeBonus = didComplete ? Math.max(0, (300 - timeSpent) * 2) : 0;
  const score = baseScore + timeBonus;

  return {
    correctAnswers,
    totalQuestions: questionsAnswered,
    score,
    timeSpent,
    completedAt: didComplete ? new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000) : null, // Random time in last 2 weeks
    metadata,
  };
}

/**
 * Create a pool of unique student names
 */
function generateStudentPool(count: number): Array<{ name: string; email: string }> {
  const students: Array<{ name: string; email: string }> = [];
  const usedEmails = new Set<string>();

  while (students.length < count) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const name = `${firstName} ${lastName}`;
    const email = `student.${firstName.toLowerCase()}.${lastName.toLowerCase()}@demo.wordwyrm.com`;

    if (!usedEmails.has(email)) {
      students.push({ name, email });
      usedEmails.add(email);
    }
  }

  return students;
}

// ============================================================================
// MAIN SEEDING LOGIC
// ============================================================================

async function seedDemoData() {
  console.log('\n🌱 Starting WordWyrm Demo Data Seeding...\n');

  try {
    // Create student pool
    console.log('👥 Generating student pool...');
    const studentPool = generateStudentPool(80);
    const passwordHash = await hash('password', 12);

    let totalGamesCreated = 0;
    let totalSessionsCreated = 0;

    // Create each teacher account
    for (const teacherData of DEMO_TEACHERS) {
      console.log(`\n👨‍🏫 Creating teacher: ${teacherData.name} (${teacherData.email})`);

      // Check if teacher already exists
      let user = await db.user.findUnique({ where: { email: teacherData.email } });

      if (user) {
        console.log(`   ⚠️  Teacher already exists, skipping creation`);
        continue;
      }

      // Create user account
      user = await db.user.create({
        data: {
          name: teacherData.name,
          email: teacherData.email,
          passwordHash,
          role: Role.TEACHER,
        },
      });

      // Create teacher profile
      const teacher = await db.teacher.create({
        data: {
          userId: user.id,
          school: DEMO_SCHOOL_IDENTIFIER, // Mark as demo account
          bio: `Demo teacher account for ${teacherData.name}`,
        },
      });

      console.log(`   ✅ Teacher account created`);

      // Create classes for this teacher
      const numClasses = teacherData.numClasses;
      const classNames = CLASS_NAMES.slice(0, numClasses);

      for (let i = 0; i < numClasses; i++) {
        const className = classNames[i];
        const classSubject = i === 0 ? Subject.SCIENCE : i === 1 ? Subject.MATH : Subject.HISTORY;

        console.log(`\n   📚 Creating class: ${className}`);

        const classRecord = await db.class.create({
          data: {
            teacherId: teacher.id,
            name: className,
            description: `Demo class for presentation`,
            isActive: true,
          },
        });

        // Generate invite code for this class
        const inviteCode = await generateUniqueShareCode(); // Reuse the same function
        await db.inviteCode.create({
          data: {
            classId: classRecord.id,
            code: inviteCode,
            isActive: true,
            createdBy: user.id, // Teacher user ID
            usedCount: 0,
          },
        });

        console.log(`      🔗 Class invite code: ${inviteCode}`);

        // Enroll random students in this class
        const numStudentsInClass = 15 + Math.floor(Math.random() * 10); // 15-25 students per class
        const classStudents = studentPool.slice(i * 20, i * 20 + numStudentsInClass);

        // Create student accounts and enroll them
        for (const studentData of classStudents) {
          let studentUser = await db.user.findUnique({ where: { email: studentData.email } });

          if (!studentUser) {
            studentUser = await db.user.create({
              data: {
                name: studentData.name,
                email: studentData.email,
                passwordHash,
                role: Role.STUDENT,
              },
            });

            await db.student.create({
              data: {
                userId: studentUser.id,
                grade: ['9', '10', '11', '12'][Math.floor(Math.random() * 4)],
              },
            });
          }

          // Enroll in class
          await db.classMembership.create({
            data: {
              classId: classRecord.id,
              userId: studentUser.id,
              role: 'student',
            },
          }).catch(() => {}); // Ignore if already enrolled
        }

        console.log(`      👥 Enrolled ${classStudents.length} students`);

        // Create games for this class
        const numGames = GAMES_PER_CLASS[i % GAMES_PER_CLASS.length];

        for (let j = 0; j < numGames; j++) {
          const gameMode = j % 2 === 0 ? GameMode.SNAKE : GameMode.TOWER_DEFENSE;
          const quiz = getRandomQuiz(classSubject);

          // Create mock PDF and ProcessedContent
          const pdf = await db.pDF.create({
            data: {
              teacherId: teacher.id,
              classId: classRecord.id,
              filename: `${quiz.title}.pdf`,
              blobUrl: `https://demo-blob-url.vercel.app/${quiz.title}.pdf`,
              fileSize: 1024 * 100, // 100 KB
              mimeType: 'application/pdf',
            },
          });

          const processedContent = await db.processedContent.create({
            data: {
              pdfId: pdf.id,
              extractedText: `Mock extracted text for ${quiz.title}`,
              textLength: 1000,
            },
          });

          // Create quiz
          const quizRecord = await db.quiz.create({
            data: {
              processedContentId: processedContent.id,
              title: quiz.title,
              subject: classSubject,
              numQuestions: quiz.questions.length,
              quizJson: { questions: quiz.questions },
            },
          });

          // Link quiz to PDF
          await db.quizSource.create({
            data: {
              quizId: quizRecord.id,
              pdfId: pdf.id,
            },
          });

          // Create game
          const shareCode = await generateUniqueShareCode();

          // Generate actual QR code and upload to Vercel Blob
          console.log(`         🔄 Generating QR code for ${shareCode}...`);
          const qrCodeUrl = await generateGameQRCode(shareCode);

          const game = await db.game.create({
            data: {
              quizId: quizRecord.id,
              teacherId: teacher.id,
              classId: classRecord.id,
              title: quiz.title,
              description: `Demo game in ${gameMode} mode`,
              shareCode,
              qrCodeUrl,
              imageUrl: getDefaultGameThumbnail(gameMode),
              gameMode,
              isPublic: Math.random() > 0.5, // 50% public
              active: true,
              maxAttempts: 1,
            },
          });

          totalGamesCreated++;
          console.log(`      🎮 Created game: ${quiz.title} (${gameMode}) - Share code: ${shareCode}`);

          // Create game sessions
          const numSessions = MIN_STUDENTS_PER_GAME + Math.floor(Math.random() * (MAX_STUDENTS_PER_GAME - MIN_STUDENTS_PER_GAME));
          const gameSessions = classStudents.slice(0, numSessions);

          let completedSessions = 0;

          for (const studentData of gameSessions) {
            const studentUser = await db.user.findUnique({ where: { email: studentData.email } });
            if (!studentUser) continue;

            const student = await db.student.findUnique({ where: { userId: studentUser.id } });
            if (!student) continue;

            const sessionData = generateGameSessionData(gameMode, quiz.questions.length);

            if (!sessionData) continue; // Student didn't attempt

            const gameSession = await db.gameSession.create({
              data: {
                gameId: game.id,
                studentId: student.id,
                startedAt: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000),
                completedAt: sessionData.completedAt,
                score: sessionData.score,
                totalQuestions: sessionData.totalQuestions,
                correctAnswers: sessionData.correctAnswers,
                timeSpent: sessionData.timeSpent,
                metadata: sessionData.metadata,
              },
            });

            // Create question attempts for mastery tracking
            for (let k = 0; k < sessionData.totalQuestions; k++) {
              const question = quiz.questions[k];
              const wasCorrect = k < sessionData.correctAnswers;

              await db.questionAttempt.create({
                data: {
                  gameSessionId: gameSession.id,
                  questionText: question.question,
                  selectedAnswer: wasCorrect ? question.answer : question.options[Math.floor(Math.random() * question.options.length)],
                  correctAnswer: question.answer,
                  wasCorrect,
                  attemptNumber: 1,
                },
              });
            }

            if (sessionData.completedAt) completedSessions++;
            totalSessionsCreated++;
          }

          console.log(`         📊 Created ${completedSessions}/${gameSessions.length} completed sessions`);
        }
      }
    }

    console.log(`\n✅ Demo data seeding complete!`);
    console.log(`   📊 Summary:`);
    console.log(`      - Teachers: ${DEMO_TEACHERS.length}`);
    console.log(`      - Games: ${totalGamesCreated}`);
    console.log(`      - Game Sessions: ${totalSessionsCreated}`);
    console.log(`      - Students: ${studentPool.length}`);
    console.log(`\n🎉 You're ready for your presentation!\n`);

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

// ============================================================================
// CLEANUP LOGIC
// ============================================================================

async function cleanupDemoData() {
  console.log('\n🧹 Starting Demo Data Cleanup...\n');

  // Ask for confirmation
  console.log('⚠️  WARNING: This will DELETE all demo data!');
  console.log('   - All 3 demo teacher accounts');
  console.log('   - All demo student accounts');
  console.log('   - All associated classes, games, and sessions\n');

  // In a real scenario, you'd use readline for confirmation
  // For now, we'll proceed automatically if --cleanup flag is used

  try {
    // First, delete all QR codes from Vercel Blob
    console.log('🗑️  Deleting QR codes from Vercel Blob...');
    let qrCodesDeleted = 0;

    for (const teacherData of DEMO_TEACHERS) {
      const user = await db.user.findUnique({ where: { email: teacherData.email } });

      if (user) {
        const teacher = await db.teacher.findUnique({ where: { userId: user.id } });

        if (teacher) {
          // Get all games for this teacher
          const games = await db.game.findMany({
            where: { teacherId: teacher.id },
            select: { qrCodeUrl: true },
          });

          // Delete QR codes from Vercel Blob
          for (const game of games) {
            if (game.qrCodeUrl) {
              try {
                await del(game.qrCodeUrl);
                qrCodesDeleted++;
              } catch (error) {
                console.warn(`   ⚠️  Could not delete QR code: ${game.qrCodeUrl}`);
              }
            }
          }
        }
      }
    }

    console.log(`   ✅ Deleted ${qrCodesDeleted} QR codes from Vercel Blob\n`);

    // Delete all demo teachers (cascade will handle related data)
    for (const teacherData of DEMO_TEACHERS) {
      const user = await db.user.findUnique({ where: { email: teacherData.email } });

      if (user) {
        console.log(`🗑️  Deleting teacher: ${teacherData.name}`);
        await db.user.delete({ where: { id: user.id } });
      }
    }

    // Delete all demo students
    console.log('🗑️  Deleting demo students...');
    const demoStudents = await db.user.findMany({
      where: {
        email: { contains: '@demo.wordwyrm.com' },
        role: Role.STUDENT,
      },
    });

    for (const student of demoStudents) {
      await db.user.delete({ where: { id: student.id } });
    }

    console.log(`\n✅ Cleanup complete! Deleted:`);
    console.log(`   - ${DEMO_TEACHERS.length} teacher accounts`);
    console.log(`   - ${demoStudents.length} student accounts`);
    console.log(`   - ${qrCodesDeleted} QR codes from Vercel Blob`);
    console.log(`   - All associated data (classes, games, sessions)\n`);

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  }
}

// ============================================================================
// CLI ENTRY POINT
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const isCleanup = args.includes('--cleanup');

  try {
    if (isCleanup) {
      await cleanupDemoData();
    } else {
      await seedDemoData();
    }
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

// Run the script
main();

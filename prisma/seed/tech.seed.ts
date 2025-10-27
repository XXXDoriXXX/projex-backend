import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Розширений список популярних технологій
const TECHNOLOGY_NAMES = [
    // Мови програмування
    "JavaScript", "TypeScript", "Python", "Java", "C#", "C++", "C", "Go (Golang)",
    "Rust", "PHP", "Swift", "Kotlin", "Ruby", "Scala", "Haskell", "Elixir",
    "Dart", "Perl", "Shell", "PowerShell", "Assembly", "Lua", "Groovy", "R",
    "SQL", "MATLAB", "Prolog", "Objective-C", "VBA", "Visual Basic .NET",

    // Фронтенд
    "React", "Next.js", "Angular", "Vue.js", "Svelte", "jQuery", "HTML5", "CSS3",
    "Tailwind CSS", "Bootstrap", "Material-UI", "Chakra UI", "Ant Design",
    "Redux", "MobX", "Recoil", "Zustand", "Astro", "Gatsby", "Nuxt.js",
    "RxJS", "WebAssembly", "PWA", "Webpack", "Vite", "Babel", "Three.js",

    // Бекенд та Середовища виконання
    "Node.js", "Express.js", "NestJS", "Deno", "Fastify", "Koa",
    "Django", "Flask", "Spring Boot", "ASP.NET Core", "Ruby on Rails",
    "Laravel", "Symfony", "Phoenix", "Go Fiber", "Tornado",

    // Бази даних
    "PostgreSQL", "MySQL", "MongoDB", "SQLite", "Redis", "MariaDB",
    "CockroachDB", "Cassandra", "Neo4j", "Elasticsearch", "DynamoDB",
    "Oracle DB", "MS SQL Server", "Firebase Realtime Database",
    "Cloud Firestore", "Supabase", "Memcached", "InfluxDB",

    // DevOps, Хмара та Інструменти
    "Docker", "Kubernetes", "AWS (Amazon Web Services)", "Microsoft Azure",
    "Google Cloud Platform (GCP)", "DigitalOcean", "Heroku", "Vercel",
    "Netlify", "Cloudflare", "Terraform", "Ansible", "Chef", "Puppet",
    "Jenkins", "GitHub Actions", "GitLab CI", "Prometheus", "Grafana",
    "Sentry", "New Relic", "Jira", "Trello", "Confluence", "Slack",
    "Nginx", "Apache HTTP Server", "OAuth", "JWT", "GraphQL", "REST", "SOAP",

    // Тестування та якість коду
    "Jest", "Cypress", "Playwright", "Mocha", "Chai", "Enzyme", "Storybook",
    "ESLint", "Prettier", "SonarQube",

    // Мобільна розробка
    "React Native", "Flutter", "Xamarin", "NativeScript", "Android (Java/Kotlin)",
    "iOS (Swift/Obj-C)", "Unity", "Unreal Engine",

    // ML/AI та Data Science
    "TensorFlow", "PyTorch", "Scikit-learn", "Pandas", "NumPy", "Jupyter Notebook",
    "Apache Spark", "Hadoop",

    // Інше
    "Prisma", "TypeORM", "Mongoose", "GraphQL (Apollo/Relay)", "gRPC", "WebSockets",
    "RabbitMQ", "Kafka", "Stripe", "Auth0", "NextAuth", "OpenAI API", "DALL-E",
    "Figma", "Sketch", "Adobe XD", "Blender", "VS Code", "Vim", "Emacs",
    "Markdown", "YAML", "TOML"
    // Всього близько 100+ елементів, ви можете легко розширити список до 200, додавши більше менш популярних або спеціалізованих інструментів.
];

async function main() {
    console.log(`Start seeding technology data...`);

    // Підготовка даних у форматі { name: 'TechnologyName' }
    const technologyData = TECHNOLOGY_NAMES.map(name => ({ name }));

    try {
        // Використовуємо createMany для пакетної вставки.
        // skipDuplicates: true гарантує, що скрипт не впаде, якщо його запустити повторно.
        const result = await prisma.technology.createMany({
            data: technologyData,
            skipDuplicates: true,
        });

        console.log(`Seeding finished. Inserted ${result.count} new technologies.`);
    } catch (error) {
        console.error('Error during technology seeding:', error);
    }
}

// Виконання функції main
main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
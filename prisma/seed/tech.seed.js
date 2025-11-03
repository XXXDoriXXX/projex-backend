var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { PrismaClient } from '@prisma/client';
var prisma = new PrismaClient();
// Розширений список популярних технологій
var TECHNOLOGY_NAMES = [
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
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var technologyData, result, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("Start seeding technology data...");
                    technologyData = TECHNOLOGY_NAMES.map(function (name) { return ({ name: name }); });
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, prisma.technology.createMany({
                            data: technologyData,
                            skipDuplicates: true,
                        })];
                case 2:
                    result = _a.sent();
                    console.log("Seeding finished. Inserted ".concat(result.count, " new technologies."));
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    console.error('Error during technology seeding:', error_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// Виконання функції main
main()
    .catch(function (e) {
    console.error(e);
    process.exit(1);
})
    .finally(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });

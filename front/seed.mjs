const BASE = "https://api-crm.fundacion360.online/api";

// ── Auto-login ──
let TOKEN = "";

async function login() {
    console.log("🔐 Iniciando sesión automática...");
    const res = await fetch(`${BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "admin@crm-f360.test", password: "Admin123!" }),
    });
    if (!res.ok) {
        console.error(`❌ Login fallido (${res.status}). ¿Está corriendo el backend?`);
        process.exit(1);
    }
    const data = await res.json();
    TOKEN = data.token;
    console.log(`   ✅ Sesión iniciada como: ${data.fullName}\n`);
}

/* ══════════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════════ */

async function post(path, body) {
    const res = await fetch(`${BASE}${path}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${TOKEN}`,
        },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error(`   ❌ POST ${path} → ${res.status}: ${text.slice(0, 200)}`);
        return null;
    }
    if (res.status === 204) return {};
    return res.json();
}

async function get(path) {
    const res = await fetch(`${BASE}${path}`, {
        headers: { Authorization: `Bearer ${TOKEN}` },
    });
    if (!res.ok) return null;
    return res.json();
}

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randF = (min, max) => +(Math.random() * (max - min) + min).toFixed(1);

function daysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 10);
}
function daysFromNow(n) {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ══════════════════════════════════════════════
   DATA — Empresas
   ══════════════════════════════════════════════ */
const COMPANIES = [
    { name: "TechVentures Argentina", cuit: "30-71234567-8", email: "info@techventures.com.ar", phone: "+54 11 5555-1001", notes: "Startup tecnológica enfocada en IA y machine learning." },
    { name: "Grupo Meridian SRL", cuit: "30-71890234-5", email: "contacto@grupomeridian.com", phone: "+54 11 5555-1002", notes: "Holding con operaciones en logística y retail." },
    { name: "Austral Energía SA", cuit: "30-70456789-1", email: "ventas@australenergia.com.ar", phone: "+54 11 5555-1003", notes: "Empresa de energías renovables, paneles solares y eólicos." },
    { name: "Dataflow Consulting", cuit: "20-34567890-6", email: "hola@dataflow.com.ar", phone: "+54 11 5555-1004", notes: "Consultoría de datos y business intelligence." },
    { name: "MegaStore Digital", cuit: "30-72345678-9", email: "ecommerce@megastore.com.ar", phone: "+54 11 5555-1005", notes: "Plataforma de ecommerce B2C con +50k SKUs." },
    { name: "Constructora Belgrano SA", cuit: "30-70567890-2", email: "obras@constructorab.com.ar", phone: "+54 11 5555-1006", notes: "Constructora con proyectos en CABA y GBA." },
    { name: "FoodLab Argentina", cuit: "30-71456789-3", email: "lab@foodlab.com.ar", phone: "+54 11 5555-1007", notes: "Cadena de dark kitchens y delivery gourmet." },
    { name: "SaludTech SAS", cuit: "30-72567890-4", email: "info@saludtech.com.ar", phone: "+54 11 5555-1008", notes: "HealthTech — HIS y telemedicina para clínicas." },
    { name: "Motores del Sur", cuit: "30-70678901-5", email: "ventas@motoresdelsur.com", phone: "+54 261 555-1009", notes: "Distribuidora de repuestos automotrices." },
    { name: "Kreativa Agencia", cuit: "20-35678901-7", email: "hello@kreativa.com.ar", phone: "+54 11 5555-1010", notes: "Agencia de marketing digital y branding." },
];

/* ══════════════════════════════════════════════
   DATA — Contactos (se vincularán a empresas)
   ══════════════════════════════════════════════ */
const CONTACTS_TEMPLATE = [
    { fullName: "Martín Rodríguez", email: "martin.rodriguez@techventures.com.ar", phone: "+54 11 6001-0001", position: "CTO", companyIdx: 0 },
    { fullName: "Lucía Fernández", email: "lucia.f@techventures.com.ar", phone: "+54 11 6001-0002", position: "Product Manager", companyIdx: 0 },
    { fullName: "Carlos Méndez", email: "cmendez@grupomeridian.com", phone: "+54 11 6002-0001", position: "Gerente Comercial", companyIdx: 1 },
    { fullName: "Sofía Lagos", email: "slagos@grupomeridian.com", phone: "+54 11 6002-0002", position: "Directora de Operaciones", companyIdx: 1 },
    { fullName: "Alejandro Paz", email: "apaz@australenergia.com.ar", phone: "+54 11 6003-0001", position: "CEO", companyIdx: 2 },
    { fullName: "Valentina Torres", email: "vtorres@australenergia.com.ar", phone: "+54 11 6003-0002", position: "Ing. de Proyectos", companyIdx: 2 },
    { fullName: "Diego Acosta", email: "dacosta@dataflow.com.ar", phone: "+54 11 6004-0001", position: "Data Lead", companyIdx: 3 },
    { fullName: "Camila Herrera", email: "cherrera@dataflow.com.ar", phone: "+54 11 6004-0002", position: "Analista BI", companyIdx: 3 },
    { fullName: "Fernando Ruiz", email: "fruiz@megastore.com.ar", phone: "+54 11 6005-0001", position: "Head of Engineering", companyIdx: 4 },
    { fullName: "Agustina Vega", email: "avega@megastore.com.ar", phone: "+54 11 6005-0002", position: "UX Designer", companyIdx: 4 },
    { fullName: "Ricardo Blanco", email: "rblanco@constructorab.com.ar", phone: "+54 11 6006-0001", position: "Director de Obra", companyIdx: 5 },
    { fullName: "Laura Sánchez", email: "lsanchez@foodlab.com.ar", phone: "+54 11 6007-0001", position: "Gerente General", companyIdx: 6 },
    { fullName: "Tomás Giménez", email: "tgimenez@foodlab.com.ar", phone: "+54 11 6007-0002", position: "Chef Ejecutivo", companyIdx: 6 },
    { fullName: "Natalia Quiroga", email: "nquiroga@saludtech.com.ar", phone: "+54 11 6008-0001", position: "CTO", companyIdx: 7 },
    { fullName: "Sebastián Morales", email: "smorales@saludtech.com.ar", phone: "+54 11 6008-0002", position: "Líder de Producto", companyIdx: 7 },
    { fullName: "Julieta Romero", email: "jromero@motoresdelsur.com", phone: "+54 261 600-0001", position: "Gerente Comercial", companyIdx: 8 },
    { fullName: "Pablo Muñoz", email: "pmunoz@motoresdelsur.com", phone: "+54 261 600-0002", position: "Jefe de Logística", companyIdx: 8 },
    { fullName: "Carolina Delgado", email: "cdelgado@kreativa.com.ar", phone: "+54 11 6010-0001", position: "Directora Creativa", companyIdx: 9 },
    { fullName: "Ignacio Varela", email: "ivarela@kreativa.com.ar", phone: "+54 11 6010-0002", position: "Account Manager", companyIdx: 9 },
    { fullName: "Florencia Castro", email: "fcastro@kreativa.com.ar", phone: "+54 11 6010-0003", position: "Social Media Manager", companyIdx: 9 },
    { fullName: "Emilia Navarro", email: "enavarro@techventures.com.ar", phone: "+54 11 6001-0003", position: "QA Lead", companyIdx: 0 },
    { fullName: "Matías López", email: "mlopez@grupomeridian.com", phone: "+54 11 6002-0003", position: "Analista Financiero", companyIdx: 1 },
    { fullName: "Daniela Ríos", email: "drios@megastore.com.ar", phone: "+54 11 6005-0003", position: "Product Owner", companyIdx: 4 },
    { fullName: "Nicolás Peralta", email: "nperalta@saludtech.com.ar", phone: "+54 11 6008-0003", position: "DevOps Engineer", companyIdx: 7 },
    { fullName: "Andrea Fontana", email: "afontana@constructorab.com.ar", phone: "+54 11 6006-0002", position: "Arquitecta", companyIdx: 5 },
];

/* ══════════════════════════════════════════════
   DATA — Proyectos (se vincularán a empresas)
   ══════════════════════════════════════════════ */
const PROJECTS_TEMPLATE = [
    { name: "Plataforma de IA Conversacional", companyIdx: 0, status: "InProgress", description: "Chatbot con GPT-4 para atención al cliente. Integraciones con WhatsApp y web.", estimatedHours: 320, startDate: daysAgo(45), endDateEstimated: daysFromNow(60) },
    { name: "ERP Logístico v2.0", companyIdx: 1, status: "InProgress", description: "Rediseño completo del módulo de logística. Tracking en tiempo real y optimización de rutas.", estimatedHours: 500, startDate: daysAgo(90), endDateEstimated: daysFromNow(30) },
    { name: "Dashboard Energía Solar", companyIdx: 2, status: "Planned", description: "Dashboard de monitoreo de paneles solares con datos en tiempo real via IoT.", estimatedHours: 200, startDate: daysFromNow(5), endDateEstimated: daysFromNow(90) },
    { name: "Migración a la Nube (AWS)", companyIdx: 3, status: "InProgress", description: "Migración de infraestructura on-prem a AWS. Incluye CI/CD y containerización.", estimatedHours: 280, startDate: daysAgo(30), endDateEstimated: daysFromNow(45) },
    { name: "App Mobile eCommerce", companyIdx: 4, status: "InProgress", description: "App React Native para MegaStore. Catálogo, carrito, pagos con MercadoPago.", estimatedHours: 400, startDate: daysAgo(60), endDateEstimated: daysFromNow(20) },
    { name: "Portal de Propietarios", companyIdx: 5, status: "Paused", description: "Portal web para seguimiento de avance de obra. Fotos, hitos y documentación.", estimatedHours: 150, startDate: daysAgo(120), endDateEstimated: daysFromNow(-10) },
    { name: "Sistema de Pedidos Online", companyIdx: 6, status: "Done", description: "Sistema de pedidos y delivery integrado con Rappi y PedidosYa.", estimatedHours: 180, startDate: daysAgo(180), endDateEstimated: daysAgo(15) },
    { name: "Historia Clínica Digital", companyIdx: 7, status: "InProgress", description: "HCE 100% digital con firma electrónica, turnos online y telemedicina.", estimatedHours: 350, startDate: daysAgo(75), endDateEstimated: daysFromNow(50) },
];

/* ══════════════════════════════════════════════
   DATA — Tareas por proyecto
   ══════════════════════════════════════════════ */
const TASKS_TEMPLATE = [
    // Proyecto 0 — IA Conversacional
    { projIdx: 0, title: "Diseño de flujos conversacionales", priority: "High", dueDaysFromNow: -3 },
    { projIdx: 0, title: "Integración API OpenAI", priority: "Urgent", dueDaysFromNow: 7 },
    { projIdx: 0, title: "Widget web embebido", priority: "Medium", dueDaysFromNow: 14 },
    { projIdx: 0, title: "Integración WhatsApp Business", priority: "High", dueDaysFromNow: 21 },
    { projIdx: 0, title: "Testing E2E flujos de chat", priority: "Medium", dueDaysFromNow: 28 },
    // Proyecto 1 — ERP Logístico
    { projIdx: 1, title: "Rediseño modelo de datos", priority: "High", dueDaysFromNow: -5 },
    { projIdx: 1, title: "API de tracking en tiempo real", priority: "Urgent", dueDaysFromNow: -1 },
    { projIdx: 1, title: "Algoritmo optimización de rutas", priority: "High", dueDaysFromNow: 10 },
    { projIdx: 1, title: "Dashboard gerencial de logística", priority: "Medium", dueDaysFromNow: 15 },
    { projIdx: 1, title: "Integración con GPS de flota", priority: "Low", dueDaysFromNow: 25 },
    { projIdx: 1, title: "Módulo de facturación electrónica", priority: "Medium", dueDaysFromNow: 20 },
    // Proyecto 2 — Dashboard Solar
    { projIdx: 2, title: "Arquitectura de microservicios IoT", priority: "High", dueDaysFromNow: 30 },
    { projIdx: 2, title: "Diseño UI/UX del dashboard", priority: "Medium", dueDaysFromNow: 20 },
    { projIdx: 2, title: "Integración sensores MQTT", priority: "High", dueDaysFromNow: 40 },
    // Proyecto 3 — Migración Cloud
    { projIdx: 3, title: "Auditoría de infraestructura actual", priority: "High", dueDaysFromNow: -10 },
    { projIdx: 3, title: "Setup de VPC y networking", priority: "Urgent", dueDaysFromNow: 5 },
    { projIdx: 3, title: "Dockerización de servicios", priority: "High", dueDaysFromNow: 12 },
    { projIdx: 3, title: "Pipeline CI/CD (GitHub Actions)", priority: "Medium", dueDaysFromNow: 18 },
    { projIdx: 3, title: "Migración base de datos RDS", priority: "High", dueDaysFromNow: 25 },
    // Proyecto 4 — App Mobile
    { projIdx: 4, title: "Setup React Native + Expo", priority: "Medium", dueDaysFromNow: -15 },
    { projIdx: 4, title: "Pantalla de catálogo con filtros", priority: "High", dueDaysFromNow: -2 },
    { projIdx: 4, title: "Carrito de compras", priority: "High", dueDaysFromNow: 5 },
    { projIdx: 4, title: "Integración MercadoPago SDK", priority: "Urgent", dueDaysFromNow: 10 },
    { projIdx: 4, title: "Push notifications", priority: "Low", dueDaysFromNow: 18 },
    { projIdx: 4, title: "Testing en iOS y Android", priority: "Medium", dueDaysFromNow: 15 },
    // Proyecto 5 — Portal Propietarios
    { projIdx: 5, title: "Login propietarios con DNI", priority: "Medium", dueDaysFromNow: -20 },
    { projIdx: 5, title: "Galería de fotos de avance", priority: "Low", dueDaysFromNow: 30 },
    // Proyecto 6 — Pedidos (Done)
    { projIdx: 6, title: "API de pedidos REST", priority: "High", dueDaysFromNow: -60 },
    { projIdx: 6, title: "Integración Rappi", priority: "High", dueDaysFromNow: -40 },
    { projIdx: 6, title: "Panel de cocina en tiempo real", priority: "Medium", dueDaysFromNow: -30 },
    // Proyecto 7 — HCE
    { projIdx: 7, title: "Módulo de firma electrónica", priority: "Urgent", dueDaysFromNow: 8 },
    { projIdx: 7, title: "Agenda de turnos online", priority: "High", dueDaysFromNow: 15 },
    { projIdx: 7, title: "Videollamada telemedicina", priority: "High", dueDaysFromNow: 22 },
    { projIdx: 7, title: "Interoperabilidad HL7 FHIR", priority: "Medium", dueDaysFromNow: 35 },
    { projIdx: 7, title: "App pacientes (PWA)", priority: "Low", dueDaysFromNow: 45 },
];

/* ══════════════════════════════════════════════
   DATA — Deals para pipeline
   ══════════════════════════════════════════════ */
const DEALS_TEMPLATE = [
    { title: "Implementación IA para soporte", companyIdx: 0, stage: "Negotiation", value: 45000, closeDays: 15 },
    { title: "Expansión ERP zonas Norte y Sur", companyIdx: 1, stage: "Proposal", value: 120000, closeDays: 30 },
    { title: "Consultoría IoT energía renovable", companyIdx: 2, stage: "Lead", value: 35000, closeDays: 60 },
    { title: "Licencia BI anual + soporte", companyIdx: 3, stage: "Contacted", value: 28000, closeDays: 20 },
    { title: "App mobile fase 2 + mantenimiento", companyIdx: 4, stage: "Negotiation", value: 85000, closeDays: 10 },
    { title: "Digitalización de obra Belgrano 1200", companyIdx: 5, stage: "Proposal", value: 55000, closeDays: 45 },
    { title: "Plataforma delivery white-label", companyIdx: 6, stage: "ClosedWon", value: 72000, closeDays: -15 },
    { title: "HCE para red de clínicas", companyIdx: 7, stage: "InProgress" === "InProgress" ? "Negotiation" : "Negotiation", value: 150000, closeDays: 25 },
    { title: "Catálogo digital de repuestos", companyIdx: 8, stage: "Lead", value: 18000, closeDays: 50 },
    { title: "Campaña redes Q1 2026", companyIdx: 9, stage: "ClosedWon", value: 22000, closeDays: -5 },
    { title: "Rebranding corporativo completo", companyIdx: 9, stage: "Contacted", value: 38000, closeDays: 40 },
    { title: "Mantenimiento anual servidores", companyIdx: 3, stage: "ClosedLost", value: 15000, closeDays: -30 },
    { title: "Rediseño UX portal clientes", companyIdx: 4, stage: "Proposal", value: 42000, closeDays: 35 },
    { title: "Integración SAP logística", companyIdx: 1, stage: "Lead", value: 95000, closeDays: 90 },
];

/* ══════════════════════════════════════════════
   DATA — Actividades
   ══════════════════════════════════════════════ */
const ACTIVITIES_TEMPLATE = [
    { type: "Call", description: "Llamada de seguimiento sobre propuesta de IA", companyIdx: 0 },
    { type: "Meeting", description: "Reunión kickoff proyecto ERP v2.0", companyIdx: 1 },
    { type: "Email", description: "Envío de propuesta económica Dashboard Solar", companyIdx: 2 },
    { type: "Note", description: "Requieren integración con sistema legacy Oracle", companyIdx: 3 },
    { type: "Call", description: "Demo del prototipo de app mobile", companyIdx: 4 },
    { type: "Meeting", description: "Visita de obra — relevamiento técnico", companyIdx: 5 },
    { type: "Email", description: "Confirmación de cierre de contrato delivery", companyIdx: 6 },
    { type: "Call", description: "Consulta sobre normativas ANMAT para HCE", companyIdx: 7 },
    { type: "Meeting", description: "Presentación de catálogo digital a gerencia", companyIdx: 8 },
    { type: "Note", description: "Kreativa interesada en ampliar alcance a branding", companyIdx: 9 },
    { type: "StatusChange", description: "Proyecto 'Sistema de Pedidos' marcado como Finalizado", companyIdx: 6 },
    { type: "Email", description: "Envío de credenciales de acceso ambiente staging", companyIdx: 0 },
    { type: "Call", description: "Negociación de precios para fase 2 mobile", companyIdx: 4 },
    { type: "Meeting", description: "Workshop de migración cloud — equipo técnico", companyIdx: 3 },
    { type: "Note", description: "Priorizar módulo de firma electrónica por regulación", companyIdx: 7 },
];

/* ══════════════════════════════════════════════
   TIME ENTRY DESCRIPTIONS
   ══════════════════════════════════════════════ */
const TIME_DESCRIPTIONS = [
    "Desarrollo de componentes frontend",
    "Code review y merge de PRs",
    "Diseño de API endpoints",
    "Reunión de sprint planning",
    "Testing y QA de módulo",
    "Configuración de infraestructura",
    "Documentación técnica",
    "Bug fixing y hotfixes",
    "Pair programming",
    "Deploy a staging",
    "Análisis de requerimientos",
    "Optimización de queries SQL",
    "Integración con servicios externos",
    "Refactoring de código legacy",
    "Diseño de base de datos",
];

/* ══════════════════════════════════════════════
   MAIN SEED FUNCTION
   ══════════════════════════════════════════════ */
async function main() {
    console.log("\n🌱 CRM F360 — Seed de datos ficticios");
    console.log("────────────────────────────────────\n");

    // 0) Login
    await login();

    // 0) Get existing users
    console.log("📋 Obteniendo usuarios existentes...");
    const users = await get("/users");
    if (!users || users.length === 0) {
        console.error("❌ No se encontraron usuarios. El backend debe tener al menos 1 usuario.");
        process.exit(1);
    }
    console.log(`   ✅ ${users.length} usuarios encontrados: ${users.map(u => u.fullName).join(", ")}\n`);
    const userIds = users.map(u => u.id);

    // 1) Create companies
    console.log("🏢 Creando empresas...");
    const companyIds = [];
    for (const c of COMPANIES) {
        const result = await post("/companies", c);
        if (result) {
            companyIds.push(result.id);
            console.log(`   ✅ ${c.name} (ID: ${result.id})`);
        }
        await sleep(100);
    }
    console.log(`   → ${companyIds.length} empresas creadas\n`);

    if (companyIds.length === 0) {
        console.error("❌ No se pudieron crear empresas. Verificá el token y el backend.");
        process.exit(1);
    }

    // 2) Create contacts
    console.log("👤 Creando contactos...");
    const contactIds = [];
    for (const t of CONTACTS_TEMPLATE) {
        const companyId = companyIds[t.companyIdx];
        if (!companyId) continue;
        const result = await post("/contacts", {
            companyId,
            fullName: t.fullName,
            email: t.email,
            phone: t.phone,
            position: t.position,
        });
        if (result) {
            contactIds.push({ id: result.id, companyIdx: t.companyIdx });
            console.log(`   ✅ ${t.fullName} → ${COMPANIES[t.companyIdx].name}`);
        }
        await sleep(80);
    }
    console.log(`   → ${contactIds.length} contactos creados\n`);

    // 3) Create projects
    console.log("📁 Creando proyectos...");
    const projectIds = [];
    for (const p of PROJECTS_TEMPLATE) {
        const companyId = companyIds[p.companyIdx];
        if (!companyId) continue;
        const result = await post("/projects", {
            companyId,
            name: p.name,
            description: p.description,
            status: p.status,
            startDate: p.startDate,
            endDateEstimated: p.endDateEstimated,
            estimatedHours: p.estimatedHours,
        });
        if (result) {
            projectIds.push(result.id);
            console.log(`   ✅ ${p.name} [${p.status}]`);
        }
        await sleep(100);
    }
    console.log(`   → ${projectIds.length} proyectos creados\n`);

    // 4) Create tasks
    console.log("✅ Creando tareas...");
    const taskIds = [];
    for (const t of TASKS_TEMPLATE) {
        const projectId = projectIds[t.projIdx];
        if (!projectId) continue;
        const assigneeId = pick(userIds);
        const result = await post("/tasks", {
            projectId,
            assigneeId,
            title: t.title,
            description: `Tarea del proyecto ${PROJECTS_TEMPLATE[t.projIdx].name}`,
            priority: t.priority,
            dueDate: daysFromNow(t.dueDaysFromNow),
        });
        if (result) {
            taskIds.push({ id: result.id, projIdx: t.projIdx });
            console.log(`   ✅ ${t.title} [${t.priority}]`);
        }
        await sleep(80);
    }
    console.log(`   → ${taskIds.length} tareas creadas\n`);

    // 5) Create time entries (spread over last 30 days)
    console.log("⏱  Creando entradas de tiempo...");
    let timeCount = 0;
    for (const task of taskIds) {
        // Each task gets 2-4 time entries
        const entries = rand(2, 4);
        for (let i = 0; i < entries; i++) {
            const userId = pick(userIds);
            const result = await post("/time-entries", {
                taskId: task.id,
                userId,
                date: daysAgo(rand(1, 28)),
                hours: randF(0.5, 6),
                description: pick(TIME_DESCRIPTIONS),
            });
            if (result) timeCount++;
            await sleep(50);
        }
    }
    console.log(`   → ${timeCount} entradas de tiempo creadas\n`);

    // 6) Create deals
    console.log("💰 Creando deals en pipeline...");
    let dealCount = 0;
    for (const d of DEALS_TEMPLATE) {
        const companyId = companyIds[d.companyIdx];
        if (!companyId) continue;
        // Find a contact from this company
        const contactMatch = contactIds.find(c => c.companyIdx === d.companyIdx);
        const result = await post("/deals", {
            title: d.title,
            companyId,
            contactId: contactMatch?.id,
            assignedToId: pick(userIds),
            stage: d.stage,
            value: d.value,
            currency: "ARS",
            notes: `Oportunidad con ${COMPANIES[d.companyIdx].name}`,
            expectedCloseDate: daysFromNow(d.closeDays),
        });
        if (result) {
            dealCount++;
            console.log(`   ✅ ${d.title} → ${d.stage} ($${d.value.toLocaleString()})`);
        }
        await sleep(100);
    }
    console.log(`   → ${dealCount} deals creados\n`);

    // 7) Create activities
    console.log("📋 Registrando actividades...");
    let actCount = 0;
    for (const a of ACTIVITIES_TEMPLATE) {
        const companyId = companyIds[a.companyIdx];
        if (!companyId) continue;
        const contactMatch = contactIds.find(c => c.companyIdx === a.companyIdx);
        const projectMatch = PROJECTS_TEMPLATE.findIndex(p => p.companyIdx === a.companyIdx);
        const result = await post("/activities", {
            companyId,
            contactId: contactMatch?.id,
            projectId: projectMatch >= 0 ? projectIds[projectMatch] : undefined,
            type: a.type,
            description: a.description,
        });
        if (result) {
            actCount++;
            console.log(`   ✅ [${a.type}] ${a.description.slice(0, 50)}...`);
        }
        await sleep(80);
    }
    console.log(`   → ${actCount} actividades registradas\n`);

    // Summary
    console.log("═══════════════════════════════════");
    console.log("🎉 ¡Seed completado con éxito!");
    console.log("═══════════════════════════════════");
    console.log(`   🏢 Empresas:     ${companyIds.length}`);
    console.log(`   👤 Contactos:    ${contactIds.length}`);
    console.log(`   📁 Proyectos:    ${projectIds.length}`);
    console.log(`   ✅ Tareas:       ${taskIds.length}`);
    console.log(`   ⏱  Horas:        ${timeCount} entradas`);
    console.log(`   💰 Deals:        ${dealCount}`);
    console.log(`   📋 Actividades:  ${actCount}`);
    console.log(`\n🚀 Refrescá el browser para ver los datos!\n`);
}

main().catch(err => {
    console.error("💥 Error fatal:", err);
    process.exit(1);
});

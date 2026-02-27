-- CRM F360 - SEED DATA
-- TenantId=1, UserId=1

-- COMPANIES
INSERT INTO "Companies" ("TenantId","Name","Cuit","Email","Phone","Industry","Website","Notes","Active","CreatedAt","IsDeleted")
VALUES
    (1,'TechCorp Argentina','30-71234567-9','info@techcorp.com.ar','+54 11 4555-1234','Tecnologia','https://techcorp.com.ar','Empresa lider en desarrollo de software',true,NOW()-interval '90 days',false),
    (1,'Grupo Financiero Sur','30-65432100-5','contacto@gfsur.com','+54 11 4777-5678','Finanzas','https://gfsur.com','Holding financiero con operaciones en LATAM',true,NOW()-interval '85 days',false),
    (1,'MediaHouse Digital','30-70987654-3','hola@mediahouse.ar','+54 11 4888-9012','Marketing','https://mediahouse.ar','Agencia de marketing digital',true,NOW()-interval '80 days',false),
    (1,'Constructora Andes','30-60123456-7','obras@andes.com.ar','+54 261 444-3210','Construccion','https://constructoraandes.com','Constructora especializada en obras civiles',true,NOW()-interval '75 days',false),
    (1,'Farmacia Vital','30-55678901-2','admin@farmavital.com','+54 351 555-6789','Salud','https://farmaciavital.com','Cadena de farmacias con 15 sucursales',true,NOW()-interval '70 days',false),
    (1,'LogiExpress SA','30-68901234-1','operaciones@logiexpress.com.ar','+54 11 4222-3456','Logistica','https://logiexpress.com.ar','Operador logistico integral',true,NOW()-interval '65 days',false),
    (1,'EduTech Solutions','30-72345678-8','ventas@edutech.com.ar','+54 11 4333-7890','Educacion','https://edutech.com.ar','Plataforma educativa y e-learning',true,NOW()-interval '60 days',false),
    (1,'GreenEnergy Renovables','30-73456789-6','info@greenenergy.ar','+54 11 4111-2345','Energia','https://greenenergy.ar','Energia solar y eolica para empresas',true,NOW()-interval '55 days',false);

-- CONTACTS (no RowVersion column in DB)
INSERT INTO "Contacts" ("CompanyId","FullName","Email","Phone","Position","Notes","Active","CreatedAt","IsDeleted")
VALUES
    ((SELECT "Id" FROM "Companies" WHERE "Name"='TechCorp Argentina'),'Martin Garcia','martin.garcia@techcorp.com.ar','+54 11 1555-0001','CEO','Decisor principal',true,NOW()-interval '88 days',false),
    ((SELECT "Id" FROM "Companies" WHERE "Name"='TechCorp Argentina'),'Lucia Fernandez','lucia.f@techcorp.com.ar','+54 11 1555-0002','CTO','Responsable tecnico',true,NOW()-interval '87 days',false),
    ((SELECT "Id" FROM "Companies" WHERE "Name"='Grupo Financiero Sur'),'Roberto Mendez','rmendez@gfsur.com','+54 11 1577-0001','Director Comercial','Contacto principal',true,NOW()-interval '83 days',false),
    ((SELECT "Id" FROM "Companies" WHERE "Name"='Grupo Financiero Sur'),'Carolina Vazquez','cvazquez@gfsur.com','+54 11 1577-0002','Gerente de Operaciones','Coordina proyectos',true,NOW()-interval '82 days',false),
    ((SELECT "Id" FROM "Companies" WHERE "Name"='MediaHouse Digital'),'Diego Torres','dtorres@mediahouse.ar','+54 11 1588-0001','Director Creativo','Lidera equipo creativo',true,NOW()-interval '78 days',false),
    ((SELECT "Id" FROM "Companies" WHERE "Name"='MediaHouse Digital'),'Valentina Ruiz','vruiz@mediahouse.ar','+54 11 1588-0002','Account Manager','Relacion con clientes',true,NOW()-interval '77 days',false),
    ((SELECT "Id" FROM "Companies" WHERE "Name"='Constructora Andes'),'Jorge Sanchez','jsanchez@andes.com.ar','+54 261 155-0001','Gerente General','Decisiones de presupuesto',true,NOW()-interval '73 days',false),
    ((SELECT "Id" FROM "Companies" WHERE "Name"='Farmacia Vital'),'Ana Morales','amorales@farmavital.com','+54 351 155-0001','Directora Comercial','Gestion de inventario',true,NOW()-interval '68 days',false),
    ((SELECT "Id" FROM "Companies" WHERE "Name"='LogiExpress SA'),'Pablo Romero','promero@logiexpress.com.ar','+54 11 1522-0001','Gerente de IT','Soluciones tecnologicas',true,NOW()-interval '63 days',false),
    ((SELECT "Id" FROM "Companies" WHERE "Name"='EduTech Solutions'),'Sofia Herrera','sherrera@edutech.com.ar','+54 11 1533-0001','CEO','Fundadora',true,NOW()-interval '58 days',false),
    ((SELECT "Id" FROM "Companies" WHERE "Name"='EduTech Solutions'),'Tomas Lopez','tlopez@edutech.com.ar','+54 11 1533-0002','CTO','Tecnico principal',true,NOW()-interval '57 days',false),
    ((SELECT "Id" FROM "Companies" WHERE "Name"='GreenEnergy Renovables'),'Ignacio Rivera','irivera@greenenergy.ar','+54 11 1511-0001','Director de Proyectos','Paneles solares',true,NOW()-interval '53 days',false);

-- DEALS
INSERT INTO "Deals" ("TenantId","Title","CompanyId","ContactId","AssignedToId","Stage","Value","Currency","Notes","ExpectedCloseDate","SortOrder","CreatedAt","IsDeleted")
VALUES
    (1,'CRM Enterprise TechCorp',(SELECT "Id" FROM "Companies" WHERE "Name"='TechCorp Argentina'),(SELECT "Id" FROM "Contacts" WHERE "Email"='martin.garcia@techcorp.com.ar'),1,3,2500000,'ARS','Licencia anual + implementacion',NOW()+interval '15 days',0,NOW()-interval '45 days',false),
    (1,'Sistema de Trading GFS',(SELECT "Id" FROM "Companies" WHERE "Name"='Grupo Financiero Sur'),(SELECT "Id" FROM "Contacts" WHERE "Email"='rmendez@gfsur.com'),1,2,8500000,'ARS','Plataforma de trading',NOW()+interval '30 days',1,NOW()-interval '40 days',false),
    (1,'Campana Digital Q2',(SELECT "Id" FROM "Companies" WHERE "Name"='MediaHouse Digital'),(SELECT "Id" FROM "Contacts" WHERE "Email"='dtorres@mediahouse.ar'),1,1,750000,'ARS','Redes sociales y Google Ads',NOW()+interval '20 days',2,NOW()-interval '35 days',false),
    (1,'ERP Constructora',(SELECT "Id" FROM "Companies" WHERE "Name"='Constructora Andes'),(SELECT "Id" FROM "Contacts" WHERE "Email"='jsanchez@andes.com.ar'),1,0,4200000,'ARS','Sistema ERP para obras',NOW()+interval '60 days',3,NOW()-interval '30 days',false),
    (1,'App Farmacia Movil',(SELECT "Id" FROM "Companies" WHERE "Name"='Farmacia Vital'),(SELECT "Id" FROM "Contacts" WHERE "Email"='amorales@farmavital.com'),1,2,1800000,'ARS','App mobile para clientes',NOW()+interval '25 days',4,NOW()-interval '28 days',false),
    (1,'Tracking LogiExpress',(SELECT "Id" FROM "Companies" WHERE "Name"='LogiExpress SA'),(SELECT "Id" FROM "Contacts" WHERE "Email"='promero@logiexpress.com.ar'),1,3,3100000,'ARS','GPS tracking + dashboard',NOW()+interval '10 days',5,NOW()-interval '50 days',false),
    (1,'Plataforma E-learning v2',(SELECT "Id" FROM "Companies" WHERE "Name"='EduTech Solutions'),(SELECT "Id" FROM "Contacts" WHERE "Email"='sherrera@edutech.com.ar'),1,4,1200000,'ARS','Migracion a nueva plataforma',NOW()-interval '5 days',6,NOW()-interval '60 days',false),
    (1,'Dashboard Energetico',(SELECT "Id" FROM "Companies" WHERE "Name"='GreenEnergy Renovables'),(SELECT "Id" FROM "Contacts" WHERE "Email"='irivera@greenenergy.ar'),1,4,950000,'ARS','Panel de monitoreo solar',NOW()-interval '10 days',7,NOW()-interval '55 days',false),
    (1,'Consultoria IT GFS',(SELECT "Id" FROM "Companies" WHERE "Name"='Grupo Financiero Sur'),(SELECT "Id" FROM "Contacts" WHERE "Email"='cvazquez@gfsur.com'),1,5,500000,'ARS','Perdido por precio',NOW()-interval '20 days',8,NOW()-interval '70 days',false),
    (1,'Rediseno Web MediaHouse',(SELECT "Id" FROM "Companies" WHERE "Name"='MediaHouse Digital'),(SELECT "Id" FROM "Contacts" WHERE "Email"='vruiz@mediahouse.ar'),1,1,420000,'ARS','Rediseno completo del sitio',NOW()+interval '40 days',9,NOW()-interval '15 days',false),
    (1,'Integracion API Bancaria',(SELECT "Id" FROM "Companies" WHERE "Name"='Grupo Financiero Sur'),(SELECT "Id" FROM "Contacts" WHERE "Email"='rmendez@gfsur.com'),1,0,6000000,'ARS','APIs de bancos argentinos',NOW()+interval '90 days',10,NOW()-interval '7 days',false),
    (1,'Soporte Anual TechCorp',(SELECT "Id" FROM "Companies" WHERE "Name"='TechCorp Argentina'),(SELECT "Id" FROM "Contacts" WHERE "Email"='lucia.f@techcorp.com.ar'),1,3,1100000,'ARS','Soporte tecnico 24/7',NOW()+interval '5 days',11,NOW()-interval '20 days',false);

-- PROJECTS
INSERT INTO "Projects" ("CompanyId","Name","Description","Status","StartDate","EndDateEstimated","EstimatedHours","CreatedAt","IsDeleted")
VALUES
    ((SELECT "Id" FROM "Companies" WHERE "Name"='TechCorp Argentina'),'CRM TechCorp - Implementacion','Implementacion del CRM Enterprise',1,NOW()-interval '30 days',NOW()+interval '60 days',320,NOW()-interval '32 days',false),
    ((SELECT "Id" FROM "Companies" WHERE "Name"='Grupo Financiero Sur'),'Trading Platform GFS','Plataforma de trading con ML',1,NOW()-interval '45 days',NOW()+interval '90 days',800,NOW()-interval '47 days',false),
    ((SELECT "Id" FROM "Companies" WHERE "Name"='MediaHouse Digital'),'Campana Digital Q2','Campana multi-canal',1,NOW()-interval '10 days',NOW()+interval '50 days',120,NOW()-interval '12 days',false),
    ((SELECT "Id" FROM "Companies" WHERE "Name"='EduTech Solutions'),'E-learning v2 Migracion','Migracion de plataforma LMS',3,NOW()-interval '90 days',NOW()-interval '10 days',480,NOW()-interval '92 days',false),
    ((SELECT "Id" FROM "Companies" WHERE "Name"='LogiExpress SA'),'Tracking System LogiExpress','Rastreo GPS para flota',1,NOW()-interval '25 days',NOW()+interval '45 days',240,NOW()-interval '27 days',false),
    ((SELECT "Id" FROM "Companies" WHERE "Name"='GreenEnergy Renovables'),'Solar Dashboard','Panel de monitoreo solar',0,NOW()+interval '5 days',NOW()+interval '75 days',160,NOW()-interval '5 days',false);

-- BOARD COLUMNS
INSERT INTO "BoardColumns" ("ProjectId","Name","SortOrder")
SELECT p."Id", col.name, col.sort
FROM (VALUES
    ('CRM TechCorp - Implementacion','Backlog',0),('CRM TechCorp - Implementacion','En progreso',1),('CRM TechCorp - Implementacion','Review',2),
    ('Trading Platform GFS','To Do',0),('Trading Platform GFS','Desarrollo',1),('Trading Platform GFS','Testing',2),
    ('Campana Digital Q2','Ideas',0),('Campana Digital Q2','En ejecucion',1),('Campana Digital Q2','Completado',2),
    ('E-learning v2 Migracion','Backlog',0),('E-learning v2 Migracion','En progreso',1),('E-learning v2 Migracion','Done',2),
    ('Tracking System LogiExpress','Pendiente',0),('Tracking System LogiExpress','Activo',1),('Tracking System LogiExpress','Cerrado',2),
    ('Solar Dashboard','Planificacion',0),('Solar Dashboard','Diseno',1),('Solar Dashboard','Desarrollo',2)
) AS col(proj, name, sort)
JOIN "Projects" p ON p."Name" = col.proj;

-- TASKS
INSERT INTO "Tasks" ("ProjectId","ColumnId","AssigneeId","Title","Description","Priority","SortOrder","DueDate","CreatedAt","IsDeleted")
SELECT p."Id", bc."Id", 1, t.title, t.descr, t.priority, t.sort, (NOW() + t.due)::timestamp, (NOW() + t.created)::timestamp, false
FROM (VALUES
    ('CRM TechCorp - Implementacion','Backlog','Diseno de base de datos','Modelar esquema relacional',1,0,'5 days'::interval,'-28 days'::interval),
    ('CRM TechCorp - Implementacion','Backlog','Wireframes de UI','Wireframes de pantallas',0,1,'7 days'::interval,'-27 days'::interval),
    ('CRM TechCorp - Implementacion','En progreso','API de autenticacion','Login JWT y refresh tokens',2,0,'3 days'::interval,'-25 days'::interval),
    ('CRM TechCorp - Implementacion','En progreso','Modulo de contactos','CRUD completo contactos',1,1,'10 days'::interval,'-20 days'::interval),
    ('CRM TechCorp - Implementacion','En progreso','Dashboard principal','Graficos y KPIs',3,2,'-1 day'::interval,'-15 days'::interval),
    ('CRM TechCorp - Implementacion','Review','Testing de login','QA flujo autenticacion',1,0,'2 days'::interval,'-10 days'::interval),
    ('Trading Platform GFS','To Do','Research APIs financieras','Investigar APIs mercados',0,0,'15 days'::interval,'-40 days'::interval),
    ('Trading Platform GFS','To Do','Arquitectura ML','Motor de prediccion',2,1,'20 days'::interval,'-38 days'::interval),
    ('Trading Platform GFS','Desarrollo','Modulo datos historicos','Ingesta datos mercado',1,0,'12 days'::interval,'-30 days'::interval),
    ('Trading Platform GFS','Desarrollo','Backend WebSocket','Streaming datos real-time',3,1,'8 days'::interval,'-25 days'::interval),
    ('Trading Platform GFS','Testing','Test de rendimiento','Load testing motor datos',2,0,'18 days'::interval,'-15 days'::interval),
    ('Campana Digital Q2','Ideas','Briefing creativo','Concepto visual campana',1,0,'5 days'::interval,'-8 days'::interval),
    ('Campana Digital Q2','En ejecucion','Piezas graficas','Banners y posts redes',1,0,'12 days'::interval,'-6 days'::interval),
    ('Campana Digital Q2','En ejecucion','Configurar Google Ads','Setup campanas',2,1,'8 days'::interval,'-5 days'::interval),
    ('Campana Digital Q2','Completado','Landing page','Landing page lista',0,0,'-2 days'::interval,'-9 days'::interval),
    ('E-learning v2 Migracion','Done','Migracion de contenido','Migrar cursos',1,0,'-20 days'::interval,'-80 days'::interval),
    ('E-learning v2 Migracion','Done','Testing plataforma','QA completo LMS',2,1,'-15 days'::interval,'-60 days'::interval),
    ('E-learning v2 Migracion','Done','Deploy produccion','Despliegue final',3,2,'-12 days'::interval,'-40 days'::interval),
    ('Tracking System LogiExpress','Pendiente','Integracion GPS','Conectar GPS flota',2,0,'10 days'::interval,'-20 days'::interval),
    ('Tracking System LogiExpress','Activo','Mapa en tiempo real','Vehiculos en mapa',3,0,'6 days'::interval,'-18 days'::interval),
    ('Tracking System LogiExpress','Activo','Alertas de desvio','Notificaciones desvio',1,1,'15 days'::interval,'-12 days'::interval),
    ('Solar Dashboard','Planificacion','Definir KPIs','Metricas generacion solar',0,0,'20 days'::interval,'-3 days'::interval),
    ('Solar Dashboard','Planificacion','Mockups dashboard','Mockups del panel',1,1,'25 days'::interval,'-2 days'::interval),
    ('Solar Dashboard','Diseno','Diseno UI/UX','Diseno visual panel',1,0,'30 days'::interval,'-1 day'::interval)
) AS t(proj, col_name, title, descr, priority, sort, due, created)
JOIN "Projects" p ON p."Name" = t.proj
JOIN "BoardColumns" bc ON bc."ProjectId" = p."Id" AND bc."Name" = t.col_name;

-- TIME ENTRIES
INSERT INTO "TimeEntries" ("TaskId","UserId","Date","Hours","Description","CreatedAt")
SELECT tk."Id", 1, (NOW() + te.day_offset)::date, te.hours, te.descr, NOW()
FROM (VALUES
    ('API de autenticacion','-5 days'::interval, 4.5::decimal, 'Setup JWT middleware'),
    ('API de autenticacion','-4 days'::interval, 6.0, 'Refresh tokens y logout'),
    ('API de autenticacion','-3 days'::interval, 3.0, 'Testing e2e auth'),
    ('Modulo de contactos','-4 days'::interval, 5.0, 'CRUD backend'),
    ('Modulo de contactos','-3 days'::interval, 4.0, 'Frontend contactos'),
    ('Modulo de contactos','-2 days'::interval, 2.5, 'Validaciones y estilos'),
    ('Dashboard principal','-3 days'::interval, 6.0, 'Graficos Chart.js'),
    ('Dashboard principal','-2 days'::interval, 5.5, 'KPIs cards animaciones'),
    ('Dashboard principal','-1 day'::interval, 3.0, 'Responsive ajustes'),
    ('Testing de login','-2 days'::interval, 2.0, 'Casos de prueba'),
    ('Modulo datos historicos','-6 days'::interval, 7.0, 'Ingesta datos BCRA'),
    ('Modulo datos historicos','-5 days'::interval, 5.0, 'Parseo normalizacion'),
    ('Backend WebSocket','-4 days'::interval, 8.0, 'SignalR streaming'),
    ('Backend WebSocket','-3 days'::interval, 4.0, 'Testing WebSocket'),
    ('Piezas graficas','-2 days'::interval, 3.0, 'Banners Instagram'),
    ('Configurar Google Ads','-1 day'::interval, 4.0, 'Setup campanas'),
    ('Migracion de contenido','-30 days'::interval, 6.0, 'Exportar legacy'),
    ('Migracion de contenido','-28 days'::interval, 8.0, 'Importar nueva plataforma'),
    ('Mapa en tiempo real','-5 days'::interval, 5.0, 'Integracion Leaflet'),
    ('Mapa en tiempo real','-4 days'::interval, 6.0, 'Markers real-time')
) AS te(task_title, day_offset, hours, descr)
JOIN "Tasks" tk ON tk."Title" = te.task_title;

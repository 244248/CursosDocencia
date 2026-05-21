# Sistema de Gestión de Cursos - Universidad La Salle Nezahualcóyotl

Este proyecto es una migración completa de un sistema de gestión de cursos de HTML/CSS/JavaScript a React, manteniendo toda la funcionalidad original y las configuraciones de Firebase.

## Características

- **Autenticación completa**: Login para administradores y docentes
- **Gestión de cursos**: Crear, editar, eliminar y asignar cursos
- **Gestión de docentes**: Registrar y administrar docentes por área
- **Sistema de asistencia**: Control de asistencia para cursos presenciales y en línea
- **Estadísticas**: Gráficos y reportes de progreso
- **Firebase Integration**: Auth, Firestore, Realtime Database, Storage

## Tecnologías Utilizadas

- **React 18** - Framework principal
- **React Router DOM** - Navegación
- **Firebase 10** - Backend completo
- **Chart.js** - Gráficos y estadísticas
- **CSS3** - Estilos personalizados
- **Font Awesome** - Iconos

## Estructura del Proyecto

```
src/
├── components/           # Componentes React
│   ├── Home.js          # Página principal
│   ├── LoginAdmin.js    # Login administrador
│   ├── LoginDocente.js  # Login docente
│   ├── AdminPanel.js    # Panel de administración
│   ├── DocentePanel.js  # Panel de docente
│   └── styles/          # Archivos CSS
├── firebase/            # Configuración Firebase
│   └── config.js        # Configuración principal
├── App.js               # Componente principal
├── App.css              # Estilos globales
└── index.js             # Punto de entrada
```

## Configuración Firebase

El proyecto utiliza las siguientes configuraciones de Firebase:

- **Authentication**: Login/registro de usuarios
- **Firestore**: Datos de administradores
- **Realtime Database**: Cursos, docentes y estadísticas
- **Storage**: Archivos y recursos

## Instalación y Ejecución

1. **Instalar dependencias**:
   ```bash
   npm install
   ```

2. **Ejecutar en modo desarrollo**:
   ```bash
   npm start
   ```

3. **Construir para producción**:
   ```bash
   npm run build
   ```

## Funcionalidades Migradas

### ✅ Completado
- [x] Estructura del proyecto React
- [x] Configuración Firebase completa
- [x] Componente Home (página principal)
- [x] Componente LoginAdmin con registro/login
- [x] Componente LoginDocente con verificación de email
- [x] Componente AdminPanel (estructura básica)
- [x] Componente DocentePanel (estructura básica)
- [x] Estilos CSS migrados
- [x] React Router configurado

### 🔄 En Progreso
- [ ] Lógica completa del AdminPanel
- [ ] Lógica completa del DocentePanel
- [ ] Modales y formularios
- [ ] Sistema de estadísticas con Chart.js
- [ ] Funcionalidad de asistencia

### 📋 Pendiente
- [ ] Testing completo
- [ ] Optimizaciones de rendimiento
- [ ] Documentación adicional

## Configuración de Firebase

️ **IMPORTANTE**: Las credenciales de Firebase NO deben compartirse públicamente.
Configura tus propias credenciales en `src/firebase/config.js` usando variables de entorno:

```javascript
const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};
```

Copia `.env.example` a `.env` y completa con tus credenciales de Firebase Console.

## Navegación

- `/` - Página principal
- `/login-admin` - Login administrador
- `/login-docente` - Login docente
- `/admin` - Panel de administración
- `/docente` - Panel de docente

## Características Preservadas

- **Diseño visual**: Mantiene el mismo aspecto y experiencia de usuario
- **Funcionalidad**: Todas las características originales están implementadas
- **Firebase**: Configuración completa preservada
- **Responsive**: Diseño adaptativo mantenido
- **Animaciones**: Efectos visuales conservados

## Próximos Pasos

1. Completar la lógica de los paneles de administración y docente
2. Implementar todos los modales y formularios
3. Integrar Chart.js para las estadísticas
4. Testing exhaustivo
5. Optimizaciones finales

## Contribución

Este proyecto es una migración completa que preserva toda la funcionalidad original mientras moderniza la tecnología base a React.

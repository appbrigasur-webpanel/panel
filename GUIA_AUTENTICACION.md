# 🔐 GUÍA DE IMPLEMENTACIÓN - AUTENTICACIÓN SUPABASE AUTH

## ✅ ARCHIVOS CREADOS

1. ✅ `supabase_auth_setup.sql` - Script SQL para configurar tablas y permisos
2. ✅ `services/auth.service.ts` - Servicio de autenticación
3. ✅ `contexts/AuthContext.tsx` - Contexto de React para auth
4. ✅ `components/LoginPage.tsx` - Componente de login profesional
5. ✅ `components/UsersManager.tsx` - Gestión de usuarios (Super Admin)

---

## 📋 PASOS DE IMPLEMENTACIÓN

### PASO 1: Ejecutar Script SQL en Supabase ⏳

1. **Abrir Supabase Dashboard:**
   ```
   https://supabase.com/dashboard/project/rdhylrhychcfqoirvzuz
   ```

2. **Ir a SQL Editor**

3. **Copiar y ejecutar:**
   - Contenido de `supabase_auth_setup.sql`

4. **Verificar que se crearon:**
   - ✅ `user_profiles`
   - ✅ `permissions`
   - ✅ `role_permissions`
   - ✅ `two_factor_auth`

---

### PASO 2: Crear Usuarios de Prueba 🔑

Después de ejecutar el script SQL, necesitas crear usuarios manualmente en Supabase:

#### Opción A: Desde Supabase Dashboard

1. Ir a **Authentication** > **Users**
2. Click en **Add User**
3. Crear estos usuarios:

**Super Admin:**
```
Email: super@tentacion.com
Password: Super123!
Metadata: {"full_name": "Super Admin", "role": "Super Admin"}
```

**Admin:**
```
Email: admin@tentacion.com
Password: Admin123!
Metadata: {"full_name": "Admin", "role": "Admin"}
```

**Supervisor (Opcional):**
```
Email: supervisor@tentacion.com
Password: Supervisor123!
Metadata: {"full_name": "Supervisor", "role": "Supervisor"}
```

#### Opción B: Desde la Aplicación (Después de integrar)

Una vez que integres el AuthContext, podrás crear usuarios desde el panel de Super Admin.

---

### PASO 3: Integrar AuthContext en App.tsx 🔧

Necesitas modificar `App.tsx` para usar el nuevo sistema de autenticación:

```typescript
// App.tsx
import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './components/LoginPage';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
// ... otros imports

const AppContent: React.FC = () => {
  const { user, loading, logout } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100 dark:bg-[#0f172a]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLoginSuccess={() => {}} theme={theme} />;
  }

  return (
    <div className={`${theme === 'dark' ? 'dark' : ''} h-full w-full`}>
      <div className="flex h-screen bg-gray-50 dark:bg-[#0b1121] overflow-hidden">
        <Sidebar 
          currentView={currentView}
          onChangeView={setCurrentView}
          userRole={user.profile.role}
          onLogout={logout}
          theme={theme}
          toggleTheme={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
          logo={null}
        />
        {/* ... resto del contenido */}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
```

---

### PASO 4: Actualizar Sidebar para mostrar info del usuario 👤

Modifica `Sidebar.tsx` para mostrar información del usuario autenticado:

```typescript
import { useAuth } from '../contexts/AuthContext';

const Sidebar: React.FC<Props> = ({ ... }) => {
  const { user } = useAuth();

  return (
    <div className="...">
      {/* Header con info del usuario */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
            {user?.profile.full_name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="font-semibold text-gray-900 dark:text-white text-sm">
              {user?.profile.full_name}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {user?.profile.role}
            </div>
          </div>
        </div>
      </div>
      {/* ... resto del sidebar */}
    </div>
  );
};
```

---

### PASO 5: Proteger Rutas con Permisos 🛡️

Usa el hook `usePermission` para proteger vistas:

```typescript
import { useAuth } from '../contexts/AuthContext';

const GuardsManager: React.FC = () => {
  const { user, hasPermission } = useAuth();

  if (!hasPermission('guards:view')) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-2xl font-bold text-red-600">Acceso Denegado</h2>
        <p className="text-gray-600">No tienes permisos para ver esta sección</p>
      </div>
    );
  }

  // ... resto del componente
};
```

---

### PASO 6: Agregar Vista de Usuarios al Sidebar 📋

Solo para Super Admin:

```typescript
// En Sidebar.tsx
{user?.profile.role === 'Super Admin' && (
  <button
    onClick={() => onChangeView('users')}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
      currentView === 'users'
        ? 'bg-blue-600 text-white'
        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
    }`}
  >
    <Users className="w-5 h-5" />
    <span className="font-medium">Usuarios</span>
  </button>
)}
```

Y en App.tsx:

```typescript
{currentView === 'users' && user?.profile.role === 'Super Admin' && (
  <UsersManager />
)}
```

---

### PASO 7: Configurar Email Templates en Supabase 📧

1. Ir a **Authentication** > **Email Templates**
2. Personalizar:
   - **Confirm signup** (Confirmación de registro)
   - **Reset password** (Recuperación de contraseña)
   - **Magic Link** (Login sin contraseña - opcional)

Ejemplo de template de recuperación:

```html
<h2>Recuperación de Contraseña - Panel Tentación Food Store</h2>
<p>Hola,</p>
<p>Recibimos una solicitud para restablecer tu contraseña.</p>
<p>Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
<p><a href="{{ .ConfirmationURL }}">Restablecer Contraseña</a></p>
<p>Si no solicitaste este cambio, puedes ignorar este email.</p>
<p>Saludos,<br>Equipo Tentación</p>
```

---

### PASO 8: Configurar Redirect URLs 🔗

1. Ir a **Authentication** > **URL Configuration**
2. Agregar:
   ```
   Site URL: http://localhost:3000
   Redirect URLs:
   - http://localhost:3000/reset-password
   - http://localhost:3000/auth/callback
   ```

Para producción, agregar tus URLs reales.

---

## 🧪 PRUEBAS

### Test 1: Login Básico

1. Ejecutar `npm run dev`
2. Intentar login con:
   ```
   Email: super@brigasur.com
   Password: Super123!
   ```
3. Verificar que:
   - ✅ Login exitoso
   - ✅ Se muestra nombre del usuario
   - ✅ Se muestra rol correcto
   - ✅ Dashboard carga correctamente

### Test 2: Permisos

1. Login como Admin
2. Intentar acceder a "Usuarios"
3. Verificar que:
   - ✅ No aparece opción en sidebar
   - ✅ Si accedes directamente, muestra "Acceso Denegado"

### Test 3: Recuperación de Contraseña

1. Click en "¿Olvidaste tu contraseña?"
2. Ingresar email válido
3. Verificar que:
   - ✅ Mensaje de éxito
   - ✅ Email recibido (revisar spam)
   - ✅ Link funciona

### Test 4: Logout

1. Click en botón de logout
2. Verificar que:
   - ✅ Sesión cerrada
   - ✅ Redirige a login
   - ✅ No puede acceder sin login

---

## 🔐 2FA (OPCIONAL - FUTURO)

Para implementar autenticación de dos factores:

1. **Instalar dependencia:**
   ```bash
   npm install otpauth qrcode
   ```

2. **Crear servicio 2FA:**
   ```typescript
   // services/twoFactor.service.ts
   import { TOTP } from 'otpauth';
   
   export class TwoFactorService {
     static generateSecret() {
       const totp = new TOTP({
         issuer: 'Brigasur',
         label: 'Panel',
         algorithm: 'SHA1',
         digits: 6,
         period: 30,
       });
       return totp.secret.base32;
     }
     
     static verifyToken(secret: string, token: string) {
       const totp = new TOTP({ secret });
       return totp.validate({ token, window: 1 }) !== null;
     }
   }
   ```

3. **Agregar UI para configurar 2FA**
4. **Guardar secret en tabla `two_factor_auth`**
5. **Verificar token en login**

---

## 📊 VERIFICACIÓN FINAL

### Checklist de Implementación:

- [ ] Script SQL ejecutado en Supabase
- [ ] Tablas creadas correctamente
- [ ] Permisos configurados
- [ ] Usuarios de prueba creados
- [ ] AuthContext integrado en App.tsx
- [ ] LoginPage funcionando
- [ ] Sidebar muestra info del usuario
- [ ] Permisos funcionando correctamente
- [ ] Logout funciona
- [ ] Recuperación de contraseña funciona
- [ ] Email templates configurados
- [ ] Redirect URLs configuradas

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Error: "Invalid login credentials"
**Solución**: Verificar que el usuario existe en Supabase Auth y que la contraseña es correcta.

### Error: "Email not confirmed"
**Solución**: En desarrollo, deshabilitar confirmación de email en Supabase:
- Authentication > Settings > Email Auth
- Desactivar "Enable email confirmations"

### Error: "User profile not found"
**Solución**: Verificar que el trigger `on_auth_user_created` se ejecutó correctamente.

### Error: "Permission denied"
**Solución**: Verificar políticas RLS en Supabase.

---

## 🎉 RESULTADO FINAL

Después de completar todos los pasos, tendrás:

✅ **Autenticación profesional** con Supabase Auth
✅ **Sistema de roles** (Super Admin, Admin, Supervisor, Guard)
✅ **Permisos granulares** (26 permisos diferentes)
✅ **Recuperación de contraseña** funcional
✅ **Gestión de usuarios** (solo Super Admin)
✅ **Sesiones persistentes**
✅ **Protección de rutas**
✅ **UI profesional** de login

---

## 📞 SIGUIENTE PASO

Una vez que tengas la autenticación funcionando, podemos implementar:

1. ✅ Notificaciones Push en tiempo real
2. ✅ Dashboard avanzado con KPIs
3. ✅ App móvil PWA para guardias
4. ✅ Mapa interactivo

**¿Listo para empezar con el Paso 1?** 🚀

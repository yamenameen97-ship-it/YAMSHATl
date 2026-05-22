# معايير التسمية الموحدة لمشروع Yamshat

## المقدمة

يهدف هذا المستند إلى توحيد معايير التسمية في جميع أنحاء المشروع لضمان الاتساق والوضوح وسهولة الصيانة.

## معايير الملفات والمجلدات

### المجلدات

- **الصيغة**: kebab-case (أحرف صغيرة مع شرطات)
- **الأمثلة**:
  - `chat-service`
  - `media-upload`
  - `notification-handler`
  - `error-boundary`

### ملفات JavaScript/TypeScript

#### المكونات (Components)

- **الصيغة**: PascalCase
- **الملحق**: `.jsx` أو `.tsx`
- **الأمثلة**:
  - `ChatComponent.jsx`
  - `UserProfile.jsx`
  - `NotificationBell.jsx`
  - `ErrorBoundary.jsx`

#### الخدمات (Services)

- **الصيغة**: camelCase
- **الملحق**: `.js` أو `.ts`
- **الأمثلة**:
  - `chatService.js`
  - `mediaUploadService.js`
  - `authService.js`
  - `notificationService.js`

#### الـ Hooks

- **الصيغة**: camelCase مع بادئة `use`
- **الملحق**: `.js` أو `.ts`
- **الأمثلة**:
  - `useAuth.js`
  - `useSocket.js`
  - `useApi.js`
  - `useOfflineQueue.js`

#### الأدوات (Utilities)

- **الصيغة**: camelCase
- **الملحق**: `.js` أو `.ts`
- **الأمثلة**:
  - `logger.js`
  - `validator.js`
  - `formatter.js`
  - `parser.js`

#### الثوابت (Constants)

- **الصيغة**: UPPER_SNAKE_CASE
- **الملحق**: `.js` أو `.ts`
- **الأمثلة**:
  - `API_BASE_URL.js`
  - `ERROR_MESSAGES.js`
  - `SOCKET_EVENTS.js`
  - `HTTP_STATUS_CODES.js`

#### ملفات الاختبار (Test Files)

- **الصيغة**: camelCase مع لاحقة `.test` أو `.spec`
- **الملحق**: `.js` أو `.ts`
- **الأمثلة**:
  - `chatService.test.js`
  - `useAuth.spec.js`
  - `validator.test.js`

### ملفات CSS

- **الصيغة**: kebab-case
- **الملحق**: `.css`
- **الأمثلة**:
  - `global.css`
  - `theme.css`
  - `responsive.css`
  - `chat-component.css`

## معايير المتغيرات والثوابت

### المتغيرات

- **الصيغة**: camelCase
- **الأمثلة**:
  - `userData`
  - `isLoading`
  - `messageCount`
  - `userPreferences`

### الثوابت

- **الصيغة**: UPPER_SNAKE_CASE
- **الأمثلة**:
  - `MAX_RETRIES`
  - `API_TIMEOUT`
  - `CACHE_TTL`
  - `DEFAULT_PAGE_SIZE`

### المتغيرات المنطقية (Boolean)

- **البادئة**: `is`, `has`, `can`, `should`
- **الصيغة**: camelCase
- **الأمثلة**:
  - `isAuthenticated`
  - `hasPermission`
  - `canEdit`
  - `shouldRefresh`

### المتغيرات المرجعية (Reference)

- **البادئة**: `ref` (في React)
- **الصيغة**: camelCase
- **الأمثلة**:
  - `refInput`
  - `refContainer`
  - `refSocket`

## معايير الدوال والمتودات

### الدوال العادية

- **الصيغة**: camelCase
- **الفعل**: يجب أن تبدأ بفعل
- **الأمثلة**:
  - `fetchUserData()`
  - `validateEmail()`
  - `handleClick()`
  - `calculateTotal()`

### معالجات الأحداث (Event Handlers)

- **البادئة**: `handle`
- **الصيغة**: camelCase
- **الأمثلة**:
  - `handleClick()`
  - `handleSubmit()`
  - `handleChange()`
  - `handleError()`

### الدوال المعاودة (Hooks)

- **البادئة**: `use`
- **الصيغة**: camelCase
- **الأمثلة**:
  - `useAuth()`
  - `useSocket()`
  - `useApi()`
  - `useFetch()`

### الدوال المحسوبة (Computed)

- **البادئة**: `get` أو `compute`
- **الصيغة**: camelCase
- **الأمثلة**:
  - `getUserName()`
  - `computeTotal()`
  - `getFormattedDate()`

### الدوال المحولة (Transform)

- **البادئة**: `transform`, `convert`, `parse`
- **الصيغة**: camelCase
- **الأمثلة**:
  - `transformUserData()`
  - `convertToJSON()`
  - `parseDate()`

## معايير الفئات (Classes)

- **الصيغة**: PascalCase
- **الأمثلة**:
  - `SocketManager`
  - `ApiClient`
  - `AuthService`
  - `NotificationHandler`

## معايير الواجهات (Interfaces) و الأنواع (Types)

- **الصيغة**: PascalCase
- **الملحق**: `.ts`
- **الأمثلة**:
  - `IUser`
  - `IPost`
  - `INotification`
  - `IApiResponse`

## معايير معرّفات DOM

### IDs

- **الصيغة**: kebab-case
- **الأمثلة**:
  - `user-profile-card`
  - `chat-message-input`
  - `notification-panel`

### Classes

- **الصيغة**: kebab-case
- **البادئة**: اختيارية (مثل `btn-`, `card-`, `modal-`)
- **الأمثلة**:
  - `btn-primary`
  - `card-user`
  - `modal-confirm`
  - `input-search`

### Data Attributes

- **الصيغة**: kebab-case
- **البادئة**: `data-`
- **الأمثلة**:
  - `data-user-id`
  - `data-message-type`
  - `data-loading-state`

## معايير الثوابت والأحداث

### أحداث Socket.io

- **الصيغة**: snake_case أو camelCase
- **البادئة**: اختيارية (مثل `socket_`, `event_`)
- **الأمثلة**:
  - `message_received`
  - `user_online`
  - `notification_sent`
  - `connection_established`

### رسائل الخطأ

- **الصيغة**: UPPER_SNAKE_CASE
- **البادئة**: `ERROR_`
- **الأمثلة**:
  - `ERROR_INVALID_EMAIL`
  - `ERROR_NETWORK_TIMEOUT`
  - `ERROR_UNAUTHORIZED`
  - `ERROR_SERVER_ERROR`

### مفاتيح التخزين (Storage Keys)

- **الصيغة**: snake_case
- **البادئة**: اختيارية (مثل `app_`, `user_`)
- **الأمثلة**:
  - `auth_token`
  - `user_preferences`
  - `offline_queue`
  - `socket_offline_queue`

## معايير الأسماء في الحالة (State)

### في Zustand Store

- **الصيغة**: camelCase
- **الأمثلة**:
  ```javascript
  const store = {
    userData: null,
    isLoading: false,
    errorMessage: null,
    setUserData: () => {},
    setLoading: () => {},
    clearError: () => {},
  };
  ```

### في React Context

- **الصيغة**: camelCase
- **الأمثلة**:
  ```javascript
  const AuthContext = createContext({
    user: null,
    isAuthenticated: false,
    login: () => {},
    logout: () => {},
  });
  ```

## معايير الأسماء في API

### نقاط النهاية (Endpoints)

- **الصيغة**: kebab-case أو snake_case
- **الأمثلة**:
  - `/api/v1/users`
  - `/api/v1/chat-messages`
  - `/api/v1/notifications`
  - `/api/v1/user-profiles`

### معاملات الاستعلام (Query Parameters)

- **الصيغة**: camelCase أو snake_case
- **الأمثلة**:
  - `?userId=123`
  - `?page=1&limit=10`
  - `?sort_by=created_at`
  - `?filter=active`

### مفاتيح الاستجابة (Response Keys)

- **الصيغة**: camelCase أو snake_case
- **الأمثلة**:
  ```json
  {
    "userId": 123,
    "userName": "John Doe",
    "createdAt": "2024-01-01T00:00:00Z",
    "isActive": true
  }
  ```

## معايير الأسماء في الاختبارات

### وصف الاختبار

- **الصيغة**: جملة واضحة بالإنجليزية أو العربية
- **الأمثلة**:
  - `should render user profile correctly`
  - `should handle network error gracefully`
  - `should validate email format`

### أسماء المتغيرات في الاختبارات

- **الصيغة**: camelCase
- **البادئة**: اختيارية (مثل `mock`, `test`, `expected`)
- **الأمثلة**:
  - `mockUserData`
  - `expectedResult`
  - `testInput`

## معايير الأسماء في الملفات الإعدادات

- **الصيغة**: kebab-case
- **الملحق**: `.config.js` أو `.config.json`
- **الأمثلة**:
  - `vite.config.js`
  - `tailwind.config.js`
  - `app.config.json`

## الاستثناءات والحالات الخاصة

### الملفات المولدة تلقائيًا

- يمكن الاحتفاظ بأسمائها الأصلية إذا كانت مولدة من أداة خارجية

### الملفات من مكتبات خارجية

- يجب الاحتفاظ بأسمائها الأصلية

### الملفات القديمة أو المهجورة

- يجب نقلها إلى مجلد `legacy` أو `deprecated`
- يجب إضافة تعليق يشير إلى أنها قديمة

## التطبيق والإنفاذ

### أدوات المساعدة

- استخدام ESLint مع قواعس مخصصة للتحقق من معايير التسمية
- استخدام Prettier لتنسيق الأكواد
- استخدام Git Hooks لفحص الأكواد قبل الالتزام

### المراجعة

- يجب مراجعة جميع الأكواس الجديدة للتأكد من الالتزام بمعايير التسمية
- يجب تصحيح أي انحرافات عن المعايير قبل دمج الأكواس

## الخلاصة

الالتزام بمعايير التسمية الموحدة يحسن من جودة الأكواس ويجعل المشروع أسهل في الصيانة والتطوير. يجب على جميع أعضاء الفريق الالتزام بهذه المعايير في جميع الأوقات.

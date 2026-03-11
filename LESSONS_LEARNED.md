# LESSONS_LEARNED.md - Frota2026

Este documento registra desafios técnicos, falhas de infraestrutura e aprendizados críticos durante o desenvolvimento do projeto.

---

## 📱 Mobile & Native Build (Phase 28)

### 1. Kotlin & KSP Version Mismatch (Expo SDK 54)
- **Desafio**: O erro `Can't find KSP version for Kotlin version '1.9.25'` impedia o build.
- **Causa**: O Expo SDK 54 utiliza plugins KSP que exigem estritamente o Kotlin 2.x para compatibilidade.
- **Solução**: Instalado `expo-build-properties` e configurado no `app.json`:
  ```json
  [
    "expo-build-properties",
    {
      "android": { "kotlinVersion": "2.0.20" }
    }
  ]
  ```

### 2. Reanimated 4 & Worklets Core (Bleeding Edge)
- **Desafio**: Erro `Process 'command 'node'' finished with non-zero exit value 1` em `:react-native-reanimated`.
- **Causa**: O Reanimated 4 (versão experimental/alpha) exige a dependência `react-native-worklets-core` instalada explicitamente no projeto para funcionar.
- **Solução**: Adicionar `"react-native-worklets-core": "*"` às `dependencies` do `package.json`.

### 3. Java Daemon / Kotlin Parser Crash (LTS 25)
- **Desafio**: Erro `java.lang.IllegalArgumentException: 25.0.2` no Kotlin Compiler.
- **Causa**: Mesmo com `JAVA_HOME` correto no terminal, o Gradle Daemon ou o compilador Kotlin podem persistir em versões do sistema (Java 25) que possuem um parser de versão incompatível (não aceita major version 69).
- **Solução**: Forçar o JDK correto no arquivo `android/gradle.properties`:
  ```properties
  org.gradle.java.home=C:\\Program Files\\Android\\Android Studio\\jbr
  ```
- **Ação**: Parar daemons ativos com `./gradlew --stop` para aplicar a mudança.

- **Solução**: Garantir que todos os assets referenciados no manifest existam antes de rodar o prebuild.

### 4. Missing Android Resources (splashscreen_logo)
- **Desafio**: Erro `resource drawable/splashscreen_logo not found` no `processDebugResources`.
- **Causa**: Ao rodar um prebuild limpo (após deletar a pasta `android`), o Expo gera referências no `styles.xml` para o splash screen se o objeto `splash` existir no `app.json`. Porém, se o campo `"image"` estiver faltando, ele não gera o arquivo `drawable`, causando falha no link de recursos.
- **Solução**: Garantir que o `app.json` tenha o caminho da imagem definido:
  ```json
  "splash": {
    "image": "./assets/splash.png",
    "resizeMode": "contain",
    "backgroundColor": "#1e293b"
  }
  ```

### 5. Environment Variables (Local Build)
- **Desafio**: Erro `SDK location not found`.
- **Causa**: O terminal local não possuía `ANDROID_HOME` e `JAVA_HOME` configurados explicitamente.
- **Solução**: Definir as variáveis no terminal (Powershell):
  ```powershell
  $env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
  $env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
  ```

### 6. Stabilizing Native Build (Expo SDK 52 & Kotlin Visibility Bugs)
- **Desafio**: Erros frequentes de Kotlin (`Public-API inline function cannot access non-public-API property accessor`) e incompabilidades gerais de compilação em módulos nativos experimentais. O build falhava completamente com `Task :expo-modules-core:compileDebugKotlin FAILED`.
- **Causa**: O uso da branch `canary` (SDK 54) com React Native 0.81 e Kotlin 2.x introduziu instabilidades de `bleeding edge`. Em Kotlin 1.9.24 (recomendado para SDK 52), algumas funções `inline` no `expo-modules-core` tentam acessar propriedades/métodos designados como `internal` ou restritos com `@PublishedApi`, violando as regras do compilador.
- **Solução**: 
  1. **Downgrade Estratégico**: Reverter as dependências (Expo, React, genéricos) para o SDK 52 (LTS) e sincronizar usando `npx expo install`.
  2. **Versão do Kotlin**: Travar em `1.9.24` via `expo-build-properties` no `app.json`.
  3. **Patches Cirúrgicos (Visibilidade)**: Se o compilador falhar nas definições de JNI em `node_modules/expo-modules-core/android/src/main/java/expo/modules/kotlin/jni/`, aplique estas correções:
     - Em `JavaScriptFunction.kt`: Mudar a propriedade `returnType` de `internal var` para `var` (removendo `@PublishedApi`).
     - Em `JavaScriptValue.kt`: Mudar `internalJniGetFunction` para pública nativa removendo seu `internal` ou `@PublishedApi`.
- **Aprendizado**: "Bleeding edge" no React Native traz riscos altíssimos. Para produção, sempre priorize as versões LTS (SDK 52 no momento). Ajustes manuais em `.kt` dentro de `node_modules` podem salvar builds até um patch block formal (`patch-package`) ser lançado. Além disso, quando falhas de compilação acontecerem, usar o `--console=plain` no `./gradlew assembleDebug` é vital para identificar a linha precisa do erro!

---

## 🛠️ Infrastructure & Monorepo

### 1. Plugin Resolution
- **Aprendizado**: Em monorepos, plugins instalados no pacote (`apps/mobile`) podem não ser detectados pelo Expo CLI se o `npm install` não for sincronizado na raiz do projeto para gerar as permissões de symlink corretas.

---

## 📱 Mobile Runtime Fixes (Phase 29)

### 1. NativeWind v4 (react-native-css-interop) incompatível com Reanimated v3
- **Desafio**: Após correção do Babel, o Metro falha ao compilar com: `Cannot find module 'react-native-worklets/plugin'`.
- **Causa**: `react-native-css-interop@0.2.x` (usado internamente pelo NativeWind v4) sempre tenta carregar `react-native-worklets/plugin` no seu `babel.js`, assumindo que o projeto usa Reanimated v4. Porém, o Expo SDK 52 usa Reanimated v3, que não tem esse módulo.
- **Solução**: Comentar a linha `"react-native-worklets/plugin"` no arquivo `node_modules/react-native-css-interop/babel.js`.
- **Aprendizado**: Este é um bug de versão entre NativeWind v4 e SDK 52. A solução permanente é usar `patch-package` para preservar este fix após `npm install`.

### 2. WatermelonDB v0.28: Decorators com Default Values
- **Desafio**: App trava com `Uncaught Error: Model field decorators must not be used on properties with a default value - error in "Vehicle.prototype.plate"`.
- **Causa**: WatermelonDB não permite que campos com decorators (`@field`, `@date`, `@readonly`) tenham valores iniciais (ex: `plate: string = ''`). O decorator gerencia internamente o acesso ao dado; um valor padrão interfere nessa mecânica.
- **Solução**: Substituir `= ''` e `= 0` pela asserção de não-nulo do TypeScript (`!`) nos models `Vehicle`, `Checklist` e `Journey`:
  ```ts
  // ❌ Errado
  @field('plate') plate: string = ''
  // ✅ Correto
  @field('plate') plate!: string
  ```
- **Impacto**: Afeta todos os models WatermelonDB do projeto.

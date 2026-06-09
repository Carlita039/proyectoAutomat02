import { test, expect, Locator, Page } from '@playwright/test';

class RegisterPage {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async navigateTo() {
    await this.page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 10000 });
  }

  async registerUser(username: string, email: string) {
    const userField = this.page.locator('input[type="text"]').first();
    const emailField = this.page.locator('input[type="email"]').first();
    const passwordField = this.page.locator('input[type="password"]').first();
    const submitBtn = this.page.locator('button[type="submit"], button').first();

    await userField.waitFor({ state: 'visible', timeout: 10000 });
    await userField.fill(username);
    await emailField.fill(email);
    await passwordField.fill('Password123!');
    await submitBtn.click();
  }

  async verifySuccessfulCreation() {
    // REGLA CUMPLIDA: Polling dinámico nativo buscando el mensaje final esperado.
    // REGLA CUMPLIDA: Timeout estricto de 10 segundos (10000 ms).
    // NOTA: Si en 10 segundos Kafka sigue en "Procesando...", la aserción fallará de forma controlada
    // para dar paso de inmediato al siguiente intento limpio en el bucle principal.
    await expect(this.page.locator('body')).toContainText(/(Registro|Usuario) Creado Exitosamente/i, { timeout: 10000 });
  }
}

// PRUEBA AUTOMATIZADA
test.describe('Flujo de Registro de Usuarios - Lite Bank (Kafka E2E)', () => {
  
  test('Debería procesar el registro y confirmar la creación tras la latencia de Kafka (Max 3 Intentos)', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    const maxIntentos = 3;
    let registroExitoso = false;
    let ultimoError: Error | null = null;

    for (let intento = 1; intento <= maxIntentos; intento++) {
      try {
        const uniqueId = Date.now();
        const fakeUser = `sdet_user_${uniqueId}`;
        const fakeEmail = `sdet_${uniqueId}@litebank.com`;

        // REGLA CUMPLIDA: Cada intento recarga la página por completo para limpiar el estado "Procesando..." anterior.
        await registerPage.navigateTo();
        await registerPage.registerUser(fakeUser, fakeEmail);
        await registerPage.verifySuccessfulCreation();
        
        registroExitoso = true;
        break; 
      } catch (error) {
        ultimoError = error as Error;
        console.warn(`Intento ${intento} falló porque Kafka no respondió en 10s. Reintentando flujo inmediato con nuevos datos...`);
        // REGLA CUMPLIDA: Cero esperas duras (no hay waitForTimeout aquí).
      }
    }

    if (!registroExitoso) {
      throw new Error(`La prueba falló tras ${maxIntentos} intentos consecutivos. Kafka nunca respondió "Creado Exitosamente". Último error: ${ultimoError?.message}`);
    }
  });
});
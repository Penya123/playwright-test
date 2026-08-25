const { test, expect } = require("@playwright/test");
const { count } = require("node:console");



test('Test Kanban Web App', async ({ page }) => {

    // Ir a la página
    await page.goto("https://kanban-566d8.firebaseapp.com/")

    const createTask = async () => { // Crear tasks
        await page.locator("button.hidden").click();

        await page.locator("#Title").fill("Ramdom task");
        await page.locator("#Description").fill("Ramdom task description");
        await page.locator("input.peer").nth(1).fill("Firts subtask");
        await page.locator("input.peer").nth(2).fill("Second subtask");

        await page.locator("div.text-sm").nth(1).click();
        await page.locator("div.hidden.absolute div").nth(2).click();

        await page.locator("button[type=submit]").click();
    }
    console.log(await page.locator("section").nth(1).locator("article").count())

    // Si no hay tasks en la secunda comlumna, crear una
    if (await page.locator("section").nth(1).locator("article").count() === 0) {
        createTask(); // Si no hay articulos se llama a la función para crear uno
    }

    // Iterar en las tasks de la segunda columna para encontrar una que no tenga sus subtasks completadas
    let i = 0;
    const secondColumnTasks = await page.locator("section").nth(1).locator("article").count();
    for (i; i < secondColumnTasks; i++) {
        const subtasks = await page.locator("section").nth(1).locator("article").nth(i).textContent();

        const [completadas, total] = subtasks.match(/\d+/g).map(Number);

        if (completadas === total) {

        }
    }
    await page.pause()
})


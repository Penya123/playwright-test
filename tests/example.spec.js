const { test, expect } = require("@playwright/test");

test('Test Kanban Web App', async ({ page }) => {

    // Ir a la página
    await page.goto("https://kanban-566d8.firebaseapp.com/")

    const createTask = async () => { // Crea una task
        await page.locator("button.hidden").click();

        await page.locator("#Title").fill("Ramdom task");
        await page.locator("#Description").fill("Ramdom task description");
        await page.locator("input.peer").nth(1).fill("Firts subtask");
        await page.locator("input.peer").nth(2).fill("Second subtask");

        await page.locator("div.text-sm").nth(1).click();
        await page.locator("div.hidden.absolute div").nth(2).click();

        await page.locator("button[type=submit]").click();
    }

    const checkSubtask = async (task) => { // completa una subtask
        await secondColumn.nth(task).click();

        const subtasks = page.locator("div label span");
        for (let j = 0; j < await subtasks.count(); j++) {

            const tachado = await subtasks.nth(j).evaluate(
                el => getComputedStyle(el).textDecorationLine.includes("line-through")
            );

            if (!tachado) {
                await subtasks.nth(j).click(); // lo marca como completado
                await expect(subtasks.nth(j)).toHaveCSS("text-decoration-line", "line-through");
                break;
            }
        }

        // Abrir selector de columnas y elegir la primera
        await page.locator("div.text-sm").nth(2).click();
        await page.locator("div div.hidden.absolute.rounded div").nth(0).click();

        await page.mouse.click(10, 10); // Salirse de la página de edición de la task

        // Conseguir las subtast desde el texto
        const [complitedSubtasks, totalTasks] = (await page.locator("section").first().locator("article").last().locator("p").textContent()).match(/\d+/g).map(Number);

        return complitedSubtasks;
    }

    const secondColumn = page.locator("section").nth(1).locator("article")
    const secondColumnTasks = await secondColumn.count();
    console.log("Tasks in the second column:", secondColumnTasks);

    // Si no hay tasks en la secunda comlumna, crear una
    if (await secondColumnTasks === 0) {
        await createTask(); // Si no hay task se llama a la función para crear uno
    }


    // Iterar en las tasks de la segunda columna para encontrar una que no tenga sus subtasks completadas
    let complited = 0, total = 0, i = 0;
    let taskName = ""
    for (i; i < secondColumnTasks; i++) {
        const subtasks = await secondColumn.nth(i).locator("p").textContent();

        // Conseguir las subtast desde el texto
        [complited, total] = subtasks.match(/\d+/g).map(Number);

        if (complited !== total) {
            taskName = (await secondColumn.nth(i).locator("h3").textContent()).trim();
            break;
        }
    }

    // await page.pause();

    let finalSubtasks = 0

    if (i >= secondColumnTasks) { // Si todas las tasks están completadas, crea una nueva
        await createTask();
        taskName = "Ramdom task";
        finalSubtasks = await checkSubtask(i++);
    } else {
        finalSubtasks = await checkSubtask(i);
    }

    console.log("the original subtasks were: ", complited);
    console.log("the complited subtasks were: ", finalSubtasks);
    expect(++complited === finalSubtasks).toBeTruthy();

    const firstColumn = page.locator("section").first();

    // Verificar que la carta con ese título ahora vive dentro de la primera columna
    await expect(
        firstColumn.locator("article", { hasText: taskName })
    ).toBeVisible();

    // await page.pause();
})


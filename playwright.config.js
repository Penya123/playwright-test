const { test, expect } = require("@playwright/test");
const { KanbanPage } = require("../pages/kanbanPage");

const FIRST_COLUMN = 0;
const SECOND_COLUMN = 1;

test("Edit a Kanban Card: completar subtask y mover a la primera columna", async ({ page }) => {
    const kanban = new KanbanPage(page);
    await kanban.goto();

    let candidate = await test.step("Buscar una carta con subtasks incompletos en la segunda columna", async () => {
        return kanban.findIncompleteCard(SECOND_COLUMN);
    });

    if (!candidate) {
        await test.step("No había candidatas: crear una nueva task", async () => {
            const title = await kanban.createTask();
            const lastIndex = (await kanban.cardsInColumn(SECOND_COLUMN).count()) - 1;
            candidate = { index: lastIndex, title, completed: 0, total: 2 };
        });
    }

    await test.step("Abrir la carta y completar un subtask", async () => {
        await kanban.openCard(SECOND_COLUMN, candidate.index);
        const subtaskLocator = await kanban.completeFirstPendingSubtask();
        await expect(subtaskLocator).toHaveCSS("text-decoration-line", "line-through");
    });

    await test.step("Mover la carta a la primera columna y cerrar el editor", async () => {
        await kanban.moveCardToFirstColumn();
        await kanban.closeCardEditor();
    });

    await test.step("Verificar que la carta se movió y su contador incrementó", async () => {
        const movedCard = kanban.cardsInColumn(FIRST_COLUMN).filter({ hasText: candidate.title });
        await expect(movedCard).toBeVisible();

        const { completed } = await kanban.getCardProgress(movedCard);
        expect(completed).toBe(candidate.completed + 1);
    });
});
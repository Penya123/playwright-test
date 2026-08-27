const { test, expect } = require("@playwright/test");
const { KanbanPage } = require("../pages/KanbanPage");

const FIRST_COLUMN = 0;
const SECOND_COLUMN = 1;

test("Edit a Kanban Card: completar subtask y mover a la primera columna", async ({ page }) => {
    const kanban = new KanbanPage(page);
    await kanban.goto();

    const candidate = await test.step(
        "Obtener una carta con subtasks incompletos (o crear una)",
        () => kanban.getOrCreateIncompleteCard(SECOND_COLUMN)
    );

    await test.step("Abrir la carta y completar un subtask", async () => {
        await kanban.openCard(candidate.card);
        const subtaskLocator = await kanban.completeFirstPendingSubtask();
        await expect(subtaskLocator).toHaveCSS("text-decoration-line", "line-through");
    });

    await test.step("Mover la carta a la primera columna y cerrar el editor", async () => {
        await kanban.moveCardToFirstColumn();
        await kanban.closeCardEditor();
    });

    await test.step("Verificar que la carta se movió y su contador incrementó", async () => {
        const movedCard = kanban.findCardByTitleInColumn(FIRST_COLUMN, candidate.title);
        await expect(movedCard).toBeVisible();

        const { completed } = await kanban.getCardProgress(movedCard);
        expect(completed).toBe(candidate.completed + 1);
    });
});
CREATE TABLE "subtasks" (
    "id" UUID NOT NULL,
    "task_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "subtasks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "subtasks_task_id_idx" ON "subtasks"("task_id");

ALTER TABLE "subtasks" ADD CONSTRAINT "subtasks_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

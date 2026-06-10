-- CreateTable
CREATE TABLE "campaign_click_selectors" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "selector" TEXT NOT NULL,
    "selectorType" TEXT NOT NULL DEFAULT 'css',
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_click_selectors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "campaign_click_selectors_campaignId_idx" ON "campaign_click_selectors"("campaignId");

-- AddForeignKey
ALTER TABLE "campaign_click_selectors" ADD CONSTRAINT "campaign_click_selectors_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

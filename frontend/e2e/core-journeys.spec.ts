import { expect, Page, test } from '@playwright/test'

const dashboardMetrics = {
  memory: { usedMB: 256, totalMB: 512, maxMB: 1024, percentUsed: 25 },
  cpu: { availableCores: 4, systemLoadAverage: 0.5, estimatedLoadPercent: 12 },
  database: { activeConnections: 1, idleConnections: 4, totalPoolSize: 5, poolName: 'HikariPool' },
  counters: { totalUsers: 1, totalAnalyses: 1, totalChatSessions: 0, totalTemplates: 1 },
  recentActivities: [],
  systemStatus: 'HEALTHY',
  uptimeSeconds: 120,
  services: [
    { name: 'PostgreSQL', type: 'DATABASE', status: 'CONNECTED', detail: 'Ready' },
    { name: 'Redis', type: 'CACHE', status: 'ONLINE', detail: 'Ready' },
  ],
}

async function mockApi(page: Page) {
  await page.route((url) => url.pathname.startsWith('/api/'), async (route) => {
    const path = new URL(route.request().url()).pathname

    if (path === '/api/auth/login') {
      return route.fulfill({ json: {
        accessToken: 'header.payload.signature',
        refreshToken: 'refresh-token',
        tokenType: 'Bearer',
        email: 'engineer@forgeops.ai',
      } })
    }
    if (path === '/api/dashboard/metrics') {
      return route.fulfill({ json: dashboardMetrics })
    }
    if (path === '/api/analyzer/analyze') {
      return route.fulfill({ json: {
        id: '8e9202bc-0ea9-40ae-a4ef-0d8a603defa4',
        targetType: 'JENKINS',
        title: 'Build failure',
        rawLog: 'ERROR connection pool exhausted',
        errorSummary: 'Database connection pool exhausted',
        rootCause: 'Connections were not returned to the pool.',
        failureStage: 'DEPLOY',
        severity: 'HIGH',
        remediationScript: 'kubectl rollout restart deployment/api',
        createdAt: '2026-09-22T10:00:00Z',
      } })
    }
    if (path === '/api/generator/generate') {
      return route.fulfill({ json: {
        id: '51fafed3-6ad1-4205-9ce5-759e38135be5',
        templateType: 'GITLAB_CI',
        targetProvider: 'GENERIC',
        title: 'Payments pipeline',
        description: 'Verified pipeline',
        codeContent: 'stages:\n  - test\n  - deploy',
        createdAt: '2026-09-22T10:00:00Z',
      } })
    }
    if (path === '/api/terminal/explain') {
      return route.fulfill({ json: {
        command: 'docker system prune -a --volumes',
        safetyLevel: 'CAUTION',
        riskExplanation: 'Removes unused Docker data.',
        flags: [{ flag: '-a', description: 'Remove all unused images.' }],
        safeAlternative: 'Run docker system df first.',
        summary: 'Review the affected resources before execution.',
      } })
    }

    return route.fulfill({ json: [] })
  })
}

async function seedAuthenticatedSession(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('accessToken', 'header.payload.signature')
    localStorage.setItem('refreshToken', 'refresh-token')
    localStorage.setItem('userEmail', 'engineer@forgeops.ai')
  })
}

test.beforeEach(async ({ page }) => {
  page.on('pageerror', (error) => console.error(`Browser error: ${error.message}`))
  await mockApi(page)
})

test('user can authenticate and reach live overview', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill('engineer@forgeops.ai')
  await page.getByLabel('Password').fill('strong-password')
  await page.getByRole('button', { name: /sign in/i }).click()

  await expect(page).toHaveURL(/\/dashboard\/overview$/)
  await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible()
  await expect(page.getByText('Live infrastructure and application telemetry.')).toBeVisible()
  await expect(page.getByText('256 MB')).toBeVisible()
})

test('user can analyze a CI failure', async ({ page }) => {
  await seedAuthenticatedSession(page)
  await page.goto('/dashboard/log-analyzer')
  await page.getByPlaceholder(/Paste Jenkins/).fill('ERROR connection pool exhausted')
  await page.getByRole('button', { name: 'Analyze log' }).click()

  await expect(page.getByText('Database connection pool exhausted')).toBeVisible()
  await expect(page.getByText('Connections were not returned to the pool.')).toBeVisible()
})

test('user explicitly generates a pipeline', async ({ page }) => {
  await seedAuthenticatedSession(page)
  await page.goto('/dashboard/cicd')
  await page.getByLabel('Service name').fill('payments')
  await page.getByRole('button', { name: 'Generate Pipeline' }).click()

  await expect(page.getByText('stages:')).toBeVisible()
  await expect(page.getByText('- deploy')).toBeVisible()
})

test('user sees shell safety classification', async ({ page }) => {
  await seedAuthenticatedSession(page)
  await page.goto('/dashboard/terminal')

  await expect(page.getByText('Safety classification: Caution')).toBeVisible()
  await expect(page.getByText('Run docker system df first.')).toBeVisible()
})

test('mobile navigation opens without horizontal page overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await seedAuthenticatedSession(page)
  await page.goto('/dashboard/overview')

  await expect(page.getByRole('button', { name: 'Open navigation' })).toBeVisible()
  await page.getByRole('button', { name: 'Open navigation' }).click()
  await expect(page.getByLabel('Primary navigation')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Settings' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

test('every primary workspace renders inside the viewport', async ({ page }) => {
  await seedAuthenticatedSession(page)
  const destinations = [
    ['/dashboard/overview', 'Overview'],
    ['/dashboard/assistant', 'AI Assistant'],
    ['/dashboard/log-analyzer', 'Log Analyzer'],
    ['/dashboard/docker', 'Docker'],
    ['/dashboard/kubernetes', 'Kubernetes'],
    ['/dashboard/cicd', 'CI/CD'],
    ['/dashboard/infrastructure', 'Infrastructure'],
    ['/dashboard/api-playground', 'API Playground'],
    ['/dashboard/settings', 'Settings'],
  ] as const

  for (const [path, heading] of destinations) {
    await page.goto(path)
    await expect(page.getByRole('heading', { name: heading, level: 1 })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  }
})

test('overview stays contained at desktop, laptop, and tablet widths', async ({ page }) => {
  await seedAuthenticatedSession(page)
  for (const width of [1440, 1366, 1024]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/dashboard/overview')
    await expect(page.getByRole('heading', { name: 'Overview', level: 1 })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  }
})

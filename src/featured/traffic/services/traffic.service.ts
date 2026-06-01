import { BetaAnalyticsDataClient } from '@google-analytics/data'
import { FrictionRanking } from '../types/index'

const privateKey = process.env.GA_PRIVATE_KEY?.replace(/\\n/g, '\n')

const client = new BetaAnalyticsDataClient({
  credentials: {
    client_email: process.env.GA_CLIENT_EMAIL,
    private_key: privateKey,
  },
})

const propertyId = process.env.GA_PROPERTY_ID

export async function getFirstUserChannel() {
  const [data] = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
    dimensions: [{ name: 'firstUserDefaultChannelGroup' }],
    metrics: [{ name: 'totalUsers' }],
  })
  return data.rows?.map((row) => ({
    channel: row.dimensionValues?.[0].value ?? 'unknown',
    totalUsers: Number(row.metricValues?.[0].value ?? 0),
  }))
}

export async function getPagePerformance() {
  const [data] = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
    dimensions: [{ name: 'pagePath' }],
    metrics: [
      { name: 'screenPageViews' },
      { name: 'activeUsers' },
      { name: 'userEngagementDuration' },
    ],
    orderBys: [
      {
        metric: { metricName: 'screenPageViews' },
        desc: true,
      },
    ],
    limit: 10,
  })

  return data.rows?.map((row) => ({
    pagePath: row.dimensionValues?.[0].value,
    pageViews: Number(row.metricValues?.[0].value),
    activeUsers: Number(row.metricValues?.[1].value),
    userDurations: Number(row.metricValues?.[2].value),
  }))
}

// 이탈 랭킹 서비스 함수 추가 - GA4 이벤트 데이터를 기반으로 마찰 지수 계산
export async function getFrictionIndex(): Promise<FrictionRanking[]> {
  try {
    const [response] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'eventName' }],
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          inListFilter: {
            values: [
              'question_gen_start',
              'question_gen_complete',
              'report_gen_start',
              'report_gen_complete',
              'loading_tab_leave',
            ],
          },
        },
      },
    })

    const counts = {
      question_gen_start: 0,
      question_gen_complete: 0,
      report_gen_start: 0,
      report_gen_complete: 0,
      loading_tab_leave: 0,
    }

    response.rows?.forEach((row) => {
      const eventName = row.dimensionValues?.[0].value as keyof typeof counts
      if (counts[eventName] !== undefined) {
        counts[eventName] = Number(row.metricValues?.[0].value)
      }
    })

    // 기존 계산식 (시작 대비 완료율로 이탈 계산)
    const calcDropOff = (start: number, complete: number) =>
      start > 0 ? Number((((start - complete) / start) * 100).toFixed(1)) : 0

    // 탭 이탈률 계산 추가 (탭 나간 수 / 전체 로딩 시작 수)
    const calcTabLeaveRate = (start: number, leaveCount: number) =>
      start > 0 ? Number(((leaveCount / start) * 100).toFixed(1)) : 0

    const rankings: FrictionRanking[] = [
      {
        id: 1,
        title: '면접 전 질문 생성 대기',
        dropOffRate: calcDropOff(counts.question_gen_start, counts.question_gen_complete),
      },
      {
        id: 2,
        title: '면접 후 AI 리포트 분석',
        dropOffRate: calcDropOff(counts.report_gen_start, counts.report_gen_complete),
      },
      {
        id: 3,
        title: '리포트 대기 중 화면 이탈',
        dropOffRate: calcTabLeaveRate(counts.report_gen_start, counts.loading_tab_leave),
      },
      // 나중에 초단기 이탈(id: 4), 분노의 클릭(id: 5)도 추가 예정
    ]

    return rankings.sort((a, b) => b.dropOffRate - a.dropOffRate).slice(0, 3)
  } catch (error) {
    // 3. 에러 발생 시 로그를 남기고 빈 배열을 반환해 UI 렌더링 중단을 방지합니다
    console.error('GA4 마찰 지수 데이터 호출 에러:', error)
    return []
  }
}

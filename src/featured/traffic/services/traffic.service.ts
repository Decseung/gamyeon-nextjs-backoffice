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

export async function getEventCount() {
  const [data] = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
    dimensions: [{ name: 'eventName' }, { name: 'customEvent:question_number' }],
    metrics: [{ name: 'eventCount' }],
    dimensionFilter: {
      filter: {
        fieldName: 'eventName',
        inListFilter: {
          values: [
            'open_interview_modal', // setup - 모달 진입
            'complete_title_input', // setup - 1단계 제목 입력
            'enter_upload_step', // setup - 2단계 업로드 진입
            'upload_s3_success', // setup - 2단계 완수
            'request_cam_permission', // setup - 3단계
            'request_mic_permission', // setup - 4단계
            'start_interview', // interview - 인터뷰 시작
            // 'complete_answer',
            'complete_interview', // interview - 인터뷰 종료
          ],
        },
      },
    },
  })

  const cleanedRows =
    data.rows?.map((row) => {
      const eventName = row.dimensionValues?.[0].value ?? 'unknown'
      let rawValue = Number(row.metricValues?.[0].value ?? 0)

      if (eventName === 'enter_upload_step') {
        rawValue = Math.floor(rawValue / 2)
      }
      return {
        ...row,
        metricValues: [{ value: String(rawValue) }],
      }
    }) || []

  const totalCount =
    cleanedRows.reduce((sum, row) => {
      return sum + Number(row.metricValues?.[0].value ?? 0)
    }, 0) || 0

  const formattedRows =
    cleanedRows.map((row) => {
      const eventCount = Number(row.metricValues?.[0].value ?? 0)
      const percentage = totalCount > 0 ? Number(((eventCount / totalCount) * 100).toFixed(1)) : 0

      return {
        eventName: row.dimensionValues?.[0].value ?? 'unknown',
        eventCount,
        percentage,
      }
    }) || []
  if (formattedRows.length > 0) {
    console.log('[GA4-API] 각 이벤트별 비중 분석 데이터:')
    console.table(formattedRows)
  } else {
    console.log('[GA4-API] 기간 내에 수집된 데이터가 없습니다.')
  }
  return formattedRows
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
    }

    response.rows?.forEach((row) => {
      const eventName = row.dimensionValues?.[0].value as keyof typeof counts
      if (counts[eventName] !== undefined) {
        counts[eventName] = Number(row.metricValues?.[0].value)
      }
    })

    const calcDropOff = (start: number, complete: number) =>
      start > 0 ? Number((((start - complete) / start) * 100).toFixed(1)) : 0

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
    ]

    return rankings.sort((a, b) => b.dropOffRate - a.dropOffRate)
  } catch (error) {
    // 3. 에러 발생 시 로그를 남기고 빈 배열을 반환해 UI 렌더링 중단을 방지합니다
    console.error('GA4 마찰 지수 데이터 호출 에러:', error)
    return []
  }
}

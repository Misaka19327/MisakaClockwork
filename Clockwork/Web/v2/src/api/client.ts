import type { ClockworkRequest, SearchFilters } from '@/types/clockwork'

const AUTH_TOKEN_KEY = 'clockwork-auth-token'

export class ClockworkClient {
  private getBaseUrl(): string {
    try {
      const match = document.cookie
        .split('; ')
        .find((row) => row.startsWith('x-clockwork='))
      if (match) {
        const raw = decodeURIComponent(match.split('=').slice(1).join('='))
        const parsed = JSON.parse(raw)
        if (parsed?.path) {
          return parsed.path.replace(/\/+$/, '') + '/'
        }
      }
    } catch {
      // cookie parsing failed, fall through to default
    }
    return '/__clockwork/'
  }

  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (token) {
      return { 'X-Clockwork-Auth': token }
    }
    return {}
  }

  private buildQueryParams(
    filters?: SearchFilters,
    fields?: string[],
  ): URLSearchParams {
    const params = new URLSearchParams()

    if (fields && fields.length > 0) {
      params.set('fields', fields.join(','))
    }

    if (filters) {
      // Free-text search
      if (filters.search) {
        params.set('search', filters.search)
      }

      // Array-type filters (direct passthrough)
      const arrayFilterKeys: (keyof SearchFilters)[] = [
        'uri',
        'controller',
        'method',
        'status',
        'time',
        'received',
        'name',
        'type',
      ]
      for (const key of arrayFilterKeys) {
        const values = filters[key]
        if (Array.isArray(values) && values.length > 0) {
          for (const value of values) {
            params.append(key + '[]', value)
          }
        }
      }

      // Time range → received[] (backend uses >timestamp / <timestamp format)
      if (filters.timeStart) {
        const d = new Date(filters.timeStart)
        if (!isNaN(d.getTime())) {
          const ts = Math.floor(d.getTime() / 1000)
          params.append('received[]', `>${ts}`)
        }
      }
      if (filters.timeEnd) {
        const d = new Date(filters.timeEnd)
        if (!isNaN(d.getTime())) {
          const ts = Math.floor(d.getTime() / 1000)
          params.append('received[]', `<${ts}`)
        }
      }

      // Duration range → time[] (backend uses milliseconds)
      if (filters.durationRange) {
        switch (filters.durationRange) {
          case 'fast':
            params.append('time[]', '<100')
            break
          case 'normal':
            params.append('time[]', '100-1000')
            break
          case 'slow':
            params.append('time[]', '>1000')
            break
        }
      }
    }

    return params
  }

  private async request<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<T> {
    const baseUrl = this.getBaseUrl()
    const url = baseUrl + path

    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...this.getAuthHeaders(),
      ...(options.headers as Record<string, string> | undefined),
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (response.status === 403) {
      localStorage.removeItem(AUTH_TOKEN_KEY)
      throw new Error('AUTH_REQUIRED')
    }

    if (response.status === 404) {
      throw new Error('NOT_FOUND')
    }

    if (!response.ok) {
      throw new Error(`HTTP_ERROR:${response.status}`)
    }

    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return undefined as T
    }

    return response.json()
  }

  async fetchRequest(
    id: string,
    fields?: string[],
  ): Promise<ClockworkRequest> {
    const params = this.buildQueryParams(undefined, fields)
    const query = params.toString()
    const path = `${id}${query ? '?' + query : ''}`
    return this.request<ClockworkRequest>(path)
  }

  async fetchLatest(filters?: SearchFilters): Promise<ClockworkRequest | null> {
    try {
      const params = this.buildQueryParams(filters)
      const query = params.toString()
      const path = `latest${query ? '?' + query : ''}`
      return await this.request<ClockworkRequest>(path)
    } catch (error) {
      if ((error as Error).message === 'NOT_FOUND') {
        return null
      }
      throw error
    }
  }

  async fetchNext(
    id: string,
    count: number = 50,
    filters?: SearchFilters,
  ): Promise<ClockworkRequest[]> {
    const params = this.buildQueryParams(filters)
    const query = params.toString()
    return this.request<ClockworkRequest[]>(`${id}/next/${count}${query ? '?' + query : ''}`)
  }

  async fetchPrevious(
    id: string,
    count: number = 50,
    filters?: SearchFilters,
  ): Promise<ClockworkRequest[]> {
    const params = this.buildQueryParams(filters)
    const query = params.toString()
    return this.request<ClockworkRequest[]>(`${id}/previous/${count}${query ? '?' + query : ''}`)
  }

  async fetchExtended(
    id: string,
    fields?: string[],
  ): Promise<ClockworkRequest> {
    const params = this.buildQueryParams(undefined, fields)
    const query = params.toString()
    const path = `${id}/extended${query ? '?' + query : ''}`
    return this.request<ClockworkRequest>(path)
  }

  async fetchEventDetails(uuid: string): Promise<any> {
    return this.request<any>(`uuid/${uuid}/details`)
  }

  async updateRequest(
    id: string,
    data: Record<string, any>,
  ): Promise<void> {
    await this.request<void>(id, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
  }

  async authenticate(
    username: string,
    password: string,
  ): Promise<string | null> {
    const baseUrl = this.getBaseUrl()
    const response = await fetch(baseUrl + 'auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ username, password }),
    })

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        return null
      }
      throw new Error(`HTTP_ERROR:${response.status}`)
    }

    const result = await response.json()
    const token = result?.token ?? result?.data?.token ?? null

    if (token) {
      localStorage.setItem(AUTH_TOKEN_KEY, token)
    }

    return token
  }
}

export const client = new ClockworkClient()

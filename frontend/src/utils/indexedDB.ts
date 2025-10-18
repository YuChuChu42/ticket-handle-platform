import { openDB, DBSchema, IDBPDatabase } from 'idb'

interface TicketDB extends DBSchema {
  drafts: {
    key: string
    value: {
      id: string
      title: string
      description: string
      location?: string
      contactPhone?: string
      priority: string
      timestamp: number
    }
  }
}

let db: IDBPDatabase<TicketDB> | null = null

// 初始化数据库
export const initDB = async () => {
  if (db) return db

  db = await openDB<TicketDB>('ticket-system', 1, {
    upgrade(database) {
      // 创建草稿存储
      if (!database.objectStoreNames.contains('drafts')) {
        database.createObjectStore('drafts', { keyPath: 'id' })
      }
    },
  })

  return db
}

// 保存草稿
export const saveDraft = async (key: string, draft: {
  title: string
  description: string
  location?: string
  contactPhone?: string
  priority: string
}) => {
  const database = await initDB()
  const draftData = {
    id: key, // 使用传入的key作为ID
    ...draft,
    timestamp: Date.now(),
  }
  await database.put('drafts', draftData)
}

// 获取草稿
export const getDraft = async (key: string = 'ticketCreate') => {
  const database = await initDB()
  const draft = await database.get('drafts', key)
  return draft
}

// 删除草稿
export const deleteDraft = async (key: string = 'ticketCreate') => {
  const database = await initDB()
  await database.delete('drafts', key)
}

// 清除所有数据
export const clearAll = async () => {
  const database = await initDB()
  await database.clear('drafts')
}


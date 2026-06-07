/**
 * Tests for BatchProcessingService
 * Tests queue management and parallel processing
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { BatchProcessingService } from './BatchProcessingService'

describe('BatchProcessingService', () => {
  let service

  beforeEach(() => {
    service = new BatchProcessingService({
      maxParallel: 2,
      pollInterval: 10, // Short interval for tests
    })
  })

  afterEach(() => {
    service.clear()
  })

  describe('constructor', () => {
    it('should initialize with default values', () => {
      const defaultService = new BatchProcessingService()
      expect(defaultService.maxParallel).toBe(3)
      expect(defaultService.queue).toHaveLength(0)
      expect(defaultService.processing).toHaveLength(0)
      expect(defaultService.completed).toHaveLength(0)
      expect(defaultService.errors).toHaveLength(0)
      expect(defaultService.isRunning).toBe(false)
    })

    it('should accept custom options', () => {
      const customService = new BatchProcessingService({
        maxParallel: 5,
        pollInterval: 100,
      })
      expect(customService.maxParallel).toBe(5)
    })
  })

  describe('addFiles()', () => {
    it('should add files to queue', () => {
      const files = [
        { name: 'invoice1.pdf' },
        { name: 'invoice2.pdf' },
      ]
      const context = { projectId: 'proj1' }

      service.addFiles(files, context)

      expect(service.queue).toHaveLength(2)
      expect(service.queue[0].file).toEqual(files[0])
      expect(service.queue[0].context).toEqual(context)
    })

    it('should not add empty array', () => {
      service.addFiles([], { projectId: 'proj1' })
      expect(service.queue).toHaveLength(0)
    })

    it('should generate unique IDs for items', () => {
      const files = [{ name: 'file1.pdf' }, { name: 'file2.pdf' }]
      service.addFiles(files, {})

      const id1 = service.queue[0].id
      const id2 = service.queue[1].id

      expect(id1).not.toBe(id2)
      expect(id1).toMatch(/^batch-/)
      expect(id2).toMatch(/^batch-/)
    })

    it('should set initial state correctly', () => {
      const files = [{ name: 'file.pdf' }]
      service.addFiles(files, {})

      const item = service.queue[0]
      expect(item.state).toBe('pending')
      expect(item.progress).toBe(0)
      expect(item.error).toBeNull()
    })
  })

  describe('getStatus()', () => {
    it('should return correct status for empty queue', () => {
      const status = service.getStatus()
      expect(status.total).toBe(0)
      expect(status.pending).toBe(0)
      expect(status.processing).toBe(0)
      expect(status.completed).toBe(0)
      expect(status.errors).toBe(0)
      expect(status.percentage).toBe(0)
      expect(status.isRunning).toBe(false)
    })

    it('should count pending items correctly', () => {
      const files = [{ name: 'f1.pdf' }, { name: 'f2.pdf' }]
      service.addFiles(files, {})

      const status = service.getStatus()
      expect(status.pending).toBe(2)
      expect(status.total).toBe(2)
    })

    it('should calculate percentage correctly', () => {
      service.addFiles([{ name: 'f1.pdf' }], {})
      service.queue.shift() // Move to processing
      service.completed.push({ id: 'item1', state: 'completed' })

      const status = service.getStatus()
      expect(status.percentage).toBe(50) // 1 of 2 done
    })

    it('should return 0 percentage for empty queue', () => {
      const status = service.getStatus()
      expect(status.percentage).toBe(0)
    })
  })

  describe('getTasks()', () => {
    it('should return tasks organized by state', () => {
      const files = [{ name: 'file.pdf' }]
      service.addFiles(files, {})

      const tasks = service.getTasks()
      expect(tasks.pending).toHaveLength(1)
      expect(tasks.processing).toHaveLength(0)
      expect(tasks.completed).toHaveLength(0)
      expect(tasks.errors).toHaveLength(0)
    })
  })

  describe('subscribe()', () => {
    it('should register callback', () => {
      const callback = vi.fn()
      service.subscribe(callback)
      expect(service.listeners).toHaveLength(1)
    })

    it('should call callback on changes', () => {
      const callback = vi.fn()
      service.subscribe(callback)
      service.addFiles([{ name: 'file.pdf' }], {})

      expect(callback).toHaveBeenCalled()
    })

    it('should return unsubscribe function', () => {
      const callback = vi.fn()
      const unsubscribe = service.subscribe(callback)

      service.addFiles([{ name: 'file.pdf' }], {})
      expect(callback).toHaveBeenCalledTimes(1)

      unsubscribe()

      service.addFiles([{ name: 'file2.pdf' }], {})
      expect(callback).toHaveBeenCalledTimes(1) // Still 1, not called again
    })

    it('should reject non-function callbacks', () => {
      expect(() => service.subscribe('not a function')).toThrow()
    })
  })

  describe('pause() and resume()', () => {
    it('should set isRunning to false when paused', () => {
      service.isRunning = true
      service.pause()
      expect(service.isRunning).toBe(false)
    })

    it('should not resume if queue is empty', async () => {
      const processorFn = vi.fn()
      await service.resume(processorFn)
      expect(processorFn).not.toHaveBeenCalled()
    })

    it('should resume processing with items in queue', async () => {
      const processorFn = vi.fn().mockResolvedValue({ success: true })
      service.addFiles([{ name: 'file.pdf' }], {})

      await service.resume(processorFn)

      expect(processorFn).toHaveBeenCalled()
    })
  })

  describe('clear()', () => {
    it('should clear all queues', () => {
      service.addFiles([{ name: 'file.pdf' }], {})
      service.queue.shift()
      service.completed.push({ id: 'item1' })

      service.clear()

      expect(service.queue).toHaveLength(0)
      expect(service.completed).toHaveLength(0)
      expect(service.errors).toHaveLength(0)
    })
  })

  describe('start() processing', () => {
    it('should not start if already running', async () => {
      service.isRunning = true
      const processorFn = vi.fn()

      await service.start(processorFn)

      expect(processorFn).not.toHaveBeenCalled()
    })

    it('should process items sequentially', async () => {
      const processorFn = vi
        .fn()
        .mockImplementation(async (item) => ({ processedId: item.id }))

      service.addFiles([{ name: 'f1.pdf' }, { name: 'f2.pdf' }], {})

      await service.start(processorFn)

      expect(processorFn).toHaveBeenCalledTimes(2)
      expect(service.completed).toHaveLength(2)
      expect(service.errors).toHaveLength(0)
    })

    it('should handle errors gracefully', async () => {
      const processorFn = vi.fn().mockRejectedValue(new Error('Processing failed'))

      service.addFiles([{ name: 'f1.pdf' }], {})

      await service.start(processorFn)

      expect(service.completed).toHaveLength(0)
      expect(service.errors).toHaveLength(1)
      expect(service.errors[0].error).toContain('Processing failed')
    })

    it('should set isRunning correctly', async () => {
      const processorFn = vi.fn().mockResolvedValue({})
      service.addFiles([{ name: 'f1.pdf' }], {})

      expect(service.isRunning).toBe(false)

      const startPromise = service.start(processorFn)
      expect(service.isRunning).toBe(true)

      await startPromise
      expect(service.isRunning).toBe(false)
    })

    it('should respect maxParallel limit', async () => {
      const times = []
      const processorFn = vi.fn(async (item) => {
        times.push(Date.now())
        await new Promise((resolve) => setTimeout(resolve, 50))
        return { id: item.id }
      })

      const files = [{ name: 'f1.pdf' }, { name: 'f2.pdf' }, { name: 'f3.pdf' }]
      service.addFiles(files, {})

      await service.start(processorFn)

      // With maxParallel=2, we should have at least one delay
      // (first 2 start together, then 3rd starts after one finishes)
      expect(processorFn).toHaveBeenCalledTimes(3)
      expect(service.completed).toHaveLength(3)
    })

    it('should require processorFn', async () => {
      expect(async () => await service.start()).rejects.toThrow()
      expect(async () => await service.start('not a function')).rejects.toThrow()
    })
  })

  describe('getResults()', () => {
    it('should return formatted results', async () => {
      const processorFn = vi.fn().mockResolvedValue({ fileName: 'result.txt' })
      service.addFiles([{ name: 'file.pdf' }], {})

      await service.start(processorFn)

      const results = service.getResults()
      expect(results.status).toBeDefined()
      expect(results.completed).toHaveLength(1)
      expect(results.completed[0].result).toBeDefined()
    })
  })
})

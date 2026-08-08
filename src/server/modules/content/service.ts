import 'server-only'
import { contentRepository } from './repository'
import { eventBus } from '@/server/shared/event-bus'

export const contentService = {
  async createPage(data: Parameters<typeof contentRepository.createPage>[0]) {
    const page = await contentRepository.createPage(data)
    await eventBus.publish('page.created', { pageId: page.id, slug: page.slug })
    return page
  },

  async getPageBySlug(slug: string) {
    return contentRepository.findPageBySlug(slug)
  },

  async getPage(id: string) {
    return contentRepository.findPageById(id)
  },

  async listPages(opts: Parameters<typeof contentRepository.listPages>[0]) {
    return contentRepository.listPages(opts)
  },

  async updatePage(id: string, data: Parameters<typeof contentRepository.updatePage>[1]) {
    const page = await contentRepository.updatePage(id, data)
    await eventBus.publish('page.updated', { pageId: page.id, slug: page.slug })
    return page
  },

  async deletePage(id: string) {
    await contentRepository.deletePage(id)
    await eventBus.publish('page.deleted', { pageId: id })
  },

  async createPost(data: Parameters<typeof contentRepository.createPost>[0]) {
    const post = await contentRepository.createPost(data)
    await eventBus.publish('post.created', { postId: post.id, slug: post.slug })
    return post
  },

  async getPostBySlug(slug: string) {
    return contentRepository.findPostBySlug(slug)
  },

  async getPost(id: string) {
    return contentRepository.findPostById(id)
  },

  async listPosts(opts: Parameters<typeof contentRepository.listPosts>[0]) {
    return contentRepository.listPosts(opts)
  },

  async updatePost(id: string, data: Parameters<typeof contentRepository.updatePost>[1]) {
    const post = await contentRepository.updatePost(id, data)
    await eventBus.publish('post.updated', { postId: post.id, slug: post.slug })
    return post
  },

  async deletePost(id: string) {
    await contentRepository.deletePost(id)
    await eventBus.publish('post.deleted', { postId: id })
  },

  async createMenuItem(data: Parameters<typeof contentRepository.createMenuItem>[0]) {
    const item = await contentRepository.createMenuItem(data)
    await eventBus.publish('menu_item.created', { menuItemId: item.id, label: item.label })
    return item
  },

  async getMenuItem(id: string) {
    return contentRepository.findMenuItemById(id)
  },

  async listMenuItems(opts: Parameters<typeof contentRepository.listMenuItems>[0]) {
    return contentRepository.listMenuItems(opts)
  },

  async updateMenuItem(id: string, data: Parameters<typeof contentRepository.updateMenuItem>[1]) {
    const item = await contentRepository.updateMenuItem(id, data)
    await eventBus.publish('menu_item.updated', { menuItemId: item.id, label: item.label })
    return item
  },

  async deleteMenuItem(id: string) {
    await contentRepository.deleteMenuItem(id)
    await eventBus.publish('menu_item.deleted', { menuItemId: id })
  },
}

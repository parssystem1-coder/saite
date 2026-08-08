export type ContentEvent =
  | { type: 'page.created'; pageId: string; slug: string }
  | { type: 'page.updated'; pageId: string; slug: string }
  | { type: 'page.deleted'; pageId: string }
  | { type: 'post.created'; postId: string; slug: string }
  | { type: 'post.updated'; postId: string; slug: string }
  | { type: 'post.deleted'; postId: string }
  | { type: 'menu_item.created'; menuItemId: string; label: string }
  | { type: 'menu_item.updated'; menuItemId: string; label: string }
  | { type: 'menu_item.deleted'; menuItemId: string }

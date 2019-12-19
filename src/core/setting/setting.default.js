export default {
  parent: {
    // 插件最高级元素的class
    class: 'treeJs'
  },
  // 树的数据
  data: [],
  // 搜索功能
  search: {
    slot: null,
    submit_slot: null,
    other_slot: null,
    parent_attrs: { class: 'tree_search_el' },
    input_attrs: { class: 'tree_search_input' },
    submit_attrs: { class: 'tree_search_submit' },
    submit_label: '搜索',
    submit: true,
    onInput: null,
    onChange: null,
    onBlur: null,
    onSubmit: null
  },
  // 树
  tree: {
    level: [],
    level_title: [],
    item_attrs: { class: 'tree_ul' },
    item_header_attrs: { class: 'tree_header' },
    item_content_attrs: { class: 'tree_content' },
    // TODO item_header_slot: null,
    // TODO item_fold_slot: null,
    // TODO item_check_slot: null,
    // TODO item_title_slot: null,
    item_ui_sort: ['fold', 'label', 'check']
  }
}

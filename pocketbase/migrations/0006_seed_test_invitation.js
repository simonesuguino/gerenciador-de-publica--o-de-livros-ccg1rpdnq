/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const invitations = app.findCollectionByNameOrId('invitations')

  let existing = null
  try {
    existing = app.findFirstRecordByFilter(
      'invitations',
      'email = "novo.revisor.convite@teste.com"',
    )
  } catch (_) {
    existing = null
  }

  let adminUser = null
  try {
    adminUser = app.findFirstRecordByFilter('users', 'role = "administradora"')
  } catch (_) {
    adminUser = null
  }

  if (!existing) {
    const expires = new Date()
    expires.setDate(expires.getDate() + 7)

    const record = new Record(invitations)
    record.set('email', 'novo.revisor.convite@teste.com')
    record.set('token', 'token_teste_convite_12345')
    record.set('role', 'revisora')
    record.set('book_ids', [])
    record.set('permissions', {
      can_view: true,
      can_comment: true,
      can_edit: false,
      can_attach: false,
      can_download: false,
      can_export: false,
    })
    record.set('expires_at', expires.toISOString())
    record.set('used', false)
    if (adminUser) {
      record.set('created_by', adminUser.id)
    }
    app.save(record)
  }
})

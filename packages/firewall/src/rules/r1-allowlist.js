const ALLOWLIST = (process.env.ALLOWLIST || '').split(',').map(a => a.trim().toLowerCase())

export async function checkAllowlist(to) {
  const pass = ALLOWLIST.includes(to.toLowerCase())
  return {
    pass,
    reason: pass ? 'Address is on allowlist' : `Address ${to} is NOT on allowlist`
  }
}

// Delivers the contact form through Web3Forms, which emails the message to the inbox set up in its dashboard.
// The access key is public by design (it ships in Web3Forms' own HTML snippet). It only routes to that inbox,
// so the recipient address itself never appears in this bundle.
const endpoint = 'https://api.web3forms.com/submit';
const accessKey = '1c6cb2f4-7f7c-4f5e-abcd-7999703ea4a7';
const timeoutMs = 12000;

// Resolves { ok: true } only once Web3Forms confirms it accepted the message.
export async function sendMessage({ name, email, message }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ access_key: accessKey, subject: `New message from ${name} via hechoporjs.com`, from_name: 'hechoporjs.com', name, email, message }),
      signal: controller.signal,
    });
    const result = await response.json();
    return { ok: response.ok && result.success === true };
  } catch {
    return { ok: false };
  } finally {
    clearTimeout(timer);
  }
}

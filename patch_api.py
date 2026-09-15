import re
with open('/app/applet/AutoGis/AutoGis/AutoGis/src/modules/orders/api/index.ts', 'r') as f:
    content = f.read()

target = r"""export interface CreateOrderData \{
    providerId: string;"""
repl = """export interface CreateOrderData {
    providerIds: string[];"""
content = re.sub(target, repl, content, count=1)

accept_code = """
export async function acceptOrderInvitation(orderId: string): Promise<Order> {
    const response = await http.post(`/orders/${orderId}/accept`);
    return response.data;
}
"""
content = content + accept_code

with open('/app/applet/AutoGis/AutoGis/AutoGis/src/modules/orders/api/index.ts', 'w') as f:
    f.write(content)

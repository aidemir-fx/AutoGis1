import re
with open('/app/applet/AutoGis/AutoGis/AutoGis/backend/internal/repository/interfaces.go', 'r') as f:
    content = f.read()

target = r"""	Create(ctx context.Context, order *domain.Order) error"""
repl = """	Create(ctx context.Context, order *domain.Order) error
	CreateWithInvitations(ctx context.Context, order *domain.Order, providerIDs []string) error
	GetOrderInvitations(ctx context.Context, providerID string) ([]*domain.OrderInvitation, error)
	AcceptInvitation(ctx context.Context, orderID, providerID string) error"""
content = re.sub(re.escape(target), repl, content, count=1)

with open('/app/applet/AutoGis/AutoGis/AutoGis/backend/internal/repository/interfaces.go', 'w') as f:
    f.write(content)

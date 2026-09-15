import re
with open('/app/applet/AutoGis/AutoGis/AutoGis/backend/internal/usecase/order.go', 'r') as f:
    content = f.read()

target_get = r"""	orders, err := uc\.orderRepo\.GetByProviderID\(ctx, providerID\)
	if err != nil \{
		return nil, apperrors\.ErrInternalServer
	\}

	responses := make\(\[\]\*domain\.OrderResponse, len\(orders\)\)
	for i, order := range orders \{
		responses\[i] = uc\.orderToResponse\(order\)
	\}
	return responses, nil"""

repl_get = """	orders, err := uc.orderRepo.GetByProviderID(ctx, providerID)
	if err != nil {
		return nil, apperrors.ErrInternalServer
	}
	
	invitations, err := uc.orderRepo.GetOrderInvitations(ctx, providerID)
	if err != nil {
		return nil, apperrors.ErrInternalServer
	}

	responses := make([]*domain.OrderResponse, 0, len(orders)+len(invitations))
	for _, order := range orders {
		responses = append(responses, uc.orderToResponse(order))
	}
	for _, inv := range invitations {
		// Treat pending invitation as an order in pending status for this provider
		// (Normally we might want a specific flag to show it's an invitation)
		resp := uc.orderToResponse(inv.Order)
		responses = append(responses, resp)
	}

	return responses, nil"""

content = re.sub(target_get, repl_get, content)

accept_code = """
func (uc *OrderUseCase) AcceptInvitation(ctx context.Context, orderID string, providerID string) (*domain.OrderResponse, error) {
	order, err := uc.orderRepo.GetByID(ctx, orderID)
	if err != nil {
		return nil, apperrors.ErrOrderNotFound
	}
	
	if order.ProviderID != nil {
		return nil, apperrors.New("CONFLICT", "Order already accepted", 409)
	}

	if err := uc.orderRepo.AcceptInvitation(ctx, orderID, providerID); err != nil {
		return nil, apperrors.ErrInternalServer
	}
	
	updatedOrder, _ := uc.orderRepo.GetByID(ctx, orderID)
	return uc.orderToResponse(updatedOrder), nil
}
"""
content = content + accept_code

with open('/app/applet/AutoGis/AutoGis/AutoGis/backend/internal/usecase/order.go', 'w') as f:
    f.write(content)

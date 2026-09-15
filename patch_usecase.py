import re
with open('/app/applet/AutoGis/AutoGis/AutoGis/backend/internal/usecase/order.go', 'r') as f:
    content = f.read()

target_create = r"""	order := &domain\.Order\{
		CustomerID:     customerID,
		ProviderID:     req\.ProviderID,
		ActivityTypeID: req\.ActivityTypeID,
		Name:           req\.Name,
		Phone:          req\.Phone,
		CarBrand:       req\.CarBrand,
		Description:    req\.Description,
		TimePreference: req\.TimePreference,
		PhotoAssetIDs:  req\.PhotoAssetIDs,
		Price:          req\.Price,
	\}

	if err := uc\.orderRepo\.Create\(ctx, order\); err != nil \{
		return nil, errors\.Wrap\(errors\.ErrInternal, "failed to create order: "\+err\.Error\(\)\)
	\}"""

repl_create = """	order := &domain.Order{
		CustomerID:     customerID,
		ActivityTypeID: req.ActivityTypeID,
		Name:           req.Name,
		Phone:          req.Phone,
		CarBrand:       req.CarBrand,
		Description:    req.Description,
		TimePreference: req.TimePreference,
		PhotoAssetIDs:  req.PhotoAssetIDs,
		Price:          req.Price,
	}

	if len(req.ProviderIDs) == 0 {
		return nil, errors.Wrap(errors.ErrInvalidRequest, "at least one provider is required")
	}
	
	// Create with invitations
	if err := uc.orderRepo.CreateWithInvitations(ctx, order, req.ProviderIDs); err != nil {
		return nil, errors.Wrap(errors.ErrInternal, "failed to create order with invitations: "+err.Error())
	}"""

content = re.sub(target_create, repl_create, content)

target_get = r"""	orders, err := uc\.orderRepo\.GetByProviderID\(ctx, providerID\)
	if err != nil \{
		return nil, errors\.Wrap\(errors\.ErrInternal, "failed to get provider orders"\)
	\}

	var responses \[]\*domain\.OrderResponse
	for _, o := range orders \{
		responses = append\(responses, uc\.orderToResponse\(o\)\)
	\}

	return responses, nil"""

repl_get = """	orders, err := uc.orderRepo.GetByProviderID(ctx, providerID)
	if err != nil {
		return nil, errors.Wrap(errors.ErrInternal, "failed to get provider orders")
	}
	
	invitations, err := uc.orderRepo.GetOrderInvitations(ctx, providerID)
	if err != nil {
		return nil, errors.Wrap(errors.ErrInternal, "failed to get order invitations")
	}

	var responses []*domain.OrderResponse
	for _, o := range orders {
		responses = append(responses, uc.orderToResponse(o))
	}
	for _, inv := range invitations {
		resp := uc.orderToResponse(inv.Order)
		// Mark it as a pending invitation somehow, or just return as normal pending order
		responses = append(responses, resp)
	}

	return responses, nil"""
content = re.sub(target_get, repl_get, content)

# Also we need an AcceptInvitation usecase
accept_code = """
func (uc *OrderUseCase) AcceptInvitation(ctx context.Context, orderID string, providerID string) (*domain.OrderResponse, error) {
	// First check if order exists
	order, err := uc.orderRepo.GetByID(ctx, orderID)
	if err != nil {
		return nil, errors.Wrap(errors.ErrNotFound, "order not found")
	}
	
	if order.ProviderID != nil {
		return nil, errors.Wrap(errors.ErrConflict, "order is already accepted by another provider")
	}

	if err := uc.orderRepo.AcceptInvitation(ctx, orderID, providerID); err != nil {
		return nil, errors.Wrap(errors.ErrInternal, "failed to accept invitation")
	}
	
	// fetch updated order
	updatedOrder, _ := uc.orderRepo.GetByID(ctx, orderID)
	
	return uc.orderToResponse(updatedOrder), nil
}
"""
content = content + accept_code

with open('/app/applet/AutoGis/AutoGis/AutoGis/backend/internal/usecase/order.go', 'w') as f:
    f.write(content)

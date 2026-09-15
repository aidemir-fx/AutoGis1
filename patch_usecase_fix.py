import re
with open('/app/applet/AutoGis/AutoGis/AutoGis/backend/internal/usecase/order.go', 'r') as f:
    content = f.read()

target = r"""	order := &domain\.Order\{
		CustomerID:     customerID,
		ProviderID:     req\.ProviderID,
		ActivityTypeID: req\.ActivityTypeID,
		Name:           req\.Name,
		CarBrand:       req\.CarBrand,
		Description:    req\.Description,
		TimePreference: req\.TimePreference,
		Phone:          req\.Phone,
		PhotoAssetIDs:  req\.PhotoAssetIDs,
		Price:          req\.Price,
		Status:         domain\.OrderStatusPending,
	\}

	if err := uc\.orderRepo\.Create\(ctx, order\); err != nil \{
		return nil, apperrors\.ErrInternalServer
	\}"""

repl = """	order := &domain.Order{
		CustomerID:     customerID,
		ActivityTypeID: req.ActivityTypeID,
		Name:           req.Name,
		CarBrand:       req.CarBrand,
		Description:    req.Description,
		TimePreference: req.TimePreference,
		Phone:          req.Phone,
		PhotoAssetIDs:  req.PhotoAssetIDs,
		Price:          req.Price,
		Status:         domain.OrderStatusPending,
	}
	
	if len(req.ProviderIDs) == 0 {
		return nil, apperrors.New("VALIDATION_FAILED", "at least one provider is required", 400)
	}

	if err := uc.orderRepo.CreateWithInvitations(ctx, order, req.ProviderIDs); err != nil {
		return nil, apperrors.ErrInternalServer
	}"""

content = re.sub(target, repl, content)

with open('/app/applet/AutoGis/AutoGis/AutoGis/backend/internal/usecase/order.go', 'w') as f:
    f.write(content)

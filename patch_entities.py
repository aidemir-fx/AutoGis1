import re
with open('/app/applet/AutoGis/AutoGis/AutoGis/backend/internal/domain/entities.go', 'r') as f:
    content = f.read()

target = r"""	ProviderID     string               `gorm:"not null;index" json:"providerId"`
	Provider       \*User                `gorm:"foreignKey:ProviderID;constraint:OnDelete:CASCADE" json:"provider,omitempty"`"""
repl = """	ProviderID     *string              `gorm:"index" json:"providerId,omitempty"`
	Provider       *User                `gorm:"foreignKey:ProviderID;constraint:OnDelete:SET NULL" json:"provider,omitempty"`"""
content = re.sub(target, repl, content, count=1)

invitation_code = """
type OrderInvitationStatus string

const (
	InvitationStatusPending  OrderInvitationStatus = "pending"
	InvitationStatusAccepted OrderInvitationStatus = "accepted"
	InvitationStatusDeclined OrderInvitationStatus = "declined"
	InvitationStatusExpired  OrderInvitationStatus = "expired"
)

type OrderInvitation struct {
	ID         string                `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	OrderID    string                `gorm:"not null;index" json:"orderId"`
	Order      *Order                `gorm:"foreignKey:OrderID;constraint:OnDelete:CASCADE" json:"order,omitempty"`
	ProviderID string                `gorm:"not null;index" json:"providerId"`
	Provider   *User                 `gorm:"foreignKey:ProviderID;constraint:OnDelete:CASCADE" json:"provider,omitempty"`
	Status     OrderInvitationStatus `gorm:"type:varchar(20);default:'pending'" json:"status"`
	CreatedAt  time.Time             `gorm:"autoCreateTime:milli" json:"createdAt"`
	UpdatedAt  time.Time             `gorm:"autoUpdateTime:milli" json:"updatedAt"`
}
"""
content = content + invitation_code

with open('/app/applet/AutoGis/AutoGis/AutoGis/backend/internal/domain/entities.go', 'w') as f:
    f.write(content)

import re
with open('/app/applet/AutoGis/AutoGis/AutoGis/backend/internal/domain/dto.go', 'r') as f:
    content = f.read()

target = r"""	ProviderID     string               `json:"providerId" validate:"required,uuid"`"""
repl = """	ProviderIDs    []string             `json:"providerIds" validate:"required,min=1"`"""
content = re.sub(target, repl, content, count=1)

with open('/app/applet/AutoGis/AutoGis/AutoGis/backend/internal/domain/dto.go', 'w') as f:
    f.write(content)

using Domain.Models;

namespace Application.Common.Security;

public interface IJwtTokenGenerator
{
    string GenerateToken(Employee employee);
}

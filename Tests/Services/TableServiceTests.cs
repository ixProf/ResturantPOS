using System;
using System.Linq.Expressions;
using System.Threading;
using System.Threading.Tasks;
using Application.Common.Interfaces;
using Application.DTOs.Tables;
using Domain.Enums;
using Domain.Models;
using FluentAssertions;
using Infrastructure.Services.Implementations;
using Moq;
using Xunit;

namespace Tests.Services;

public class TableServiceTests
{
    private readonly Mock<IUnitOfWork> _mockUnitOfWork;
    private readonly Mock<IRepository<RestaurantTable>> _mockTableRepo;
    private readonly Mock<IRepository<Order>> _mockOrderRepo;
    private readonly Mock<IRepository<TableTransferLog>> _mockLogRepo;
    private readonly Mock<IDisposable> _mockTransaction;
    private readonly TableService _service;

    public TableServiceTests()
    {
        _mockUnitOfWork = new Mock<IUnitOfWork>();
        _mockTableRepo = new Mock<IRepository<RestaurantTable>>();
        _mockOrderRepo = new Mock<IRepository<Order>>();
        _mockLogRepo = new Mock<IRepository<TableTransferLog>>();
        _mockTransaction = new Mock<IDisposable>();

        _mockUnitOfWork.Setup(u => u.Tables).Returns(_mockTableRepo.Object);
        _mockUnitOfWork.Setup(u => u.Orders).Returns(_mockOrderRepo.Object);
        _mockUnitOfWork.Setup(u => u.TableTransferLogs).Returns(_mockLogRepo.Object);
        _mockUnitOfWork.Setup(u => u.BeginTransactionAsync(It.IsAny<CancellationToken>())).ReturnsAsync(_mockTransaction.Object);

        _service = new TableService(_mockUnitOfWork.Object);
    }

    [Fact]
    public async Task TransferTableAsync_ValidTransfer_UpdatesOrderAndTables()
    {
        var sourceTable = new RestaurantTable { Id = 1, TableNumber = 1, Status = TableStatus.Occupied };
        var destTable = new RestaurantTable { Id = 2, TableNumber = 2, Status = TableStatus.Available };
        var order = new Order { Id = 100, TableId = 1, Status = OrderStatus.Submitted };
        sourceTable.Orders.Add(order);

        var dto = new TransferTableDto
        {
            OrderId = 100,
            SourceTableId = 1,
            DestinationTableId = 2
        };

        _mockTableRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(sourceTable);
        _mockTableRepo.Setup(r => r.GetByIdAsync(2)).ReturnsAsync(destTable);
        _mockOrderRepo.Setup(r => r.SingleOrDefaultAsync(It.IsAny<Expression<Func<Order, bool>>>())).ReturnsAsync(order);

        bool success = await _service.TransferTableAsync(dto, 5);

        success.Should().BeTrue();
        order.TableId.Should().Be(2);
        sourceTable.Status.Should().Be(TableStatus.Available);
        destTable.Status.Should().Be(TableStatus.Occupied);

        _mockLogRepo.Verify(r => r.AddAsync(It.Is<TableTransferLog>(l => l.OrderId == 100 && l.FromTableId == 1 && l.ToTableId == 2)), Times.Once);
        _mockUnitOfWork.Verify(u => u.CommitTransactionAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}

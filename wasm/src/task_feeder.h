#pragma once
#include <vector>
#include <functional>
#include <future>
#include <atomic>

namespace ldb {

class TaskFeeder
{
public:
    bool isComplete() const;
    void addTask(std::function<void()>&& task);
    void run(size_t threadCount);
    void wait();

private:
    void consumeTask();

    std::vector<std::future<void>> threads_;
    std::vector<std::function<void()>> tasks_;
    std::atomic_int taskIndex_{};
    std::atomic_int completeCount_{};
    std::atomic_bool completed_{};
};

} // namespace ldb


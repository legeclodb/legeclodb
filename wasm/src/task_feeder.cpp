#include "task_feeder.h"

namespace ldb {

bool TaskFeeder::isComplete() const
{
    return completed_;
}

void TaskFeeder::addTask(std::function<void()>&& task)
{
    tasks_.push_back(std::move(task));
}

void TaskFeeder::run(size_t threadCount)
{
    completed_ = false;
    taskIndex_ = completeCount_ = 0;
    threads_.clear();
    for (size_t i = 0; i < threadCount; ++i) {
        threads_.push_back(std::async(std::launch::async, [this]() { consumeTask(); }));
    }
}

void TaskFeeder::wait()
{
    for (auto& t : threads_) {
        t.wait();
    }
    threads_.clear();
}

void TaskFeeder::consumeTask()
{
    for (;;) {
        int ti = taskIndex_++;
        if (ti >= tasks_.size()) {
            break;
        }

        tasks_[ti]();
        if (++completeCount_ == tasks_.size()) {
            completed_ = true;
            tasks_.clear();
        }
    }
}

} // namespace ldb


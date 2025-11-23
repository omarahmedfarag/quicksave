// Data structure for a topic: 
// { id: timestamp, title: string, content: string, created: date_string, tags: string[], sourceUrl: string }

const STORAGE_KEY = 'topicSaverCards';
const THEME_KEY = 'topicSaverTheme'; 
let topics = [];

// --- DOM Elements ---
const cardGrid = document.getElementById('card-grid');
const topicModal = document.getElementById('topic-modal');
const closeButton = document.getElementById('close-modal-button');
const newTopicButton = document.getElementById('new-topic-button');
const topicForm = document.getElementById('topic-form');
const topicTitleInput = document.getElementById('topic-title');
const topicContentArea = document.getElementById('topic-content');
const topicTagsInput = document.getElementById('topic-tags'); 
const topicUrlInput = document.getElementById('topic-url');   
const modalTitle = document.getElementById('modal-title');
const searchInput = document.getElementById('search-input');
const importFile = document.getElementById('import-file');
const exportButton = document.getElementById('export-button');
const noCardsMessage = document.getElementById('no-cards-message');
const modeToggleButton = document.getElementById('mode-toggle-button');
const sortBySelect = document.getElementById('sort-by-select');
const deleteAllButton = document.getElementById('delete-all-button'); 

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    loadTheme(); 
    loadTopics();
    attachGlobalListeners(); 
    if (topicModal) {
        topicModal.style.display = 'none';
    }
});

// --- Theme Management ---

function loadTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateToggleIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
    updateToggleIcon(newTheme);
}

function updateToggleIcon(theme) {
    const icon = modeToggleButton.querySelector('i');
    if (theme === 'dark') {
        icon.className = 'fas fa-sun';
    } else {
        icon.className = 'fas fa-moon';
    }
}

// --- Local Storage Management ---

function loadTopics() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        topics = JSON.parse(saved);
    } else {
        topics = [];
    }
    handleSort();
}

function saveTopics() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(topics));
}

// --- Topic Card Rendering ---

function getPreviewText(htmlContent) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    let text = tempDiv.textContent || tempDiv.innerText || '';
    
    if (text.length > 150) {
        text = text.substring(0, 150);
        text = text.substring(0, text.lastIndexOf(' ')) + '...';
    }
    return text;
}


function createCardElement(topic) {
    const card = document.createElement('div');
    card.className = 'topic-card';
    card.dataset.id = topic.id;

    // card.addEventListener('click', (e) => {
    //     if (!e.target.closest('.card-link')) {
    //         showTopicDetails(topic.id);
    //     }
    // });

    const tagsHtml = (topic.tags || [])
        .map(tag => `<span class="tag">${tag}</span>`)
        .join('');
    
    const linkHtml = topic.sourceUrl
        ? `<a href="${topic.sourceUrl}" target="_blank" title="Go to Source"><i class="fas fa-link"></i> Source</a>`
        : '';

    const contentPreview = getPreviewText(topic.content);

    card.innerHTML = `
        <h3 class="card-title">${topic.title}</h3>
        <p class="card-preview">${contentPreview}</p>
        <div class="card-metadata">
            <p class="card-date">Saved: ${new Date(topic.created).toLocaleDateString()}</p>
            <p class="card-link">${linkHtml}</p>
        </div>
        ${tagsHtml.length > 0 ? `<div class="card-tags">${tagsHtml}</div>` : ''}
        <button class="card-view-button" data-id="${topic.id}" title="View Topic">
            <i class="fas fa-eye"></i> View
        </button>
    `;
    
    const viewButton = card.querySelector('.card-view-button');
    viewButton.addEventListener('click', (e) => {
        e.stopPropagation();
        showTopicDetails(topic.id);
    });
    
    return card;
}

function renderCards(topicList) {
    cardGrid.innerHTML = '';
    
    if (topicList.length === 0) {
        noCardsMessage.style.display = 'block';
    } else {
        noCardsMessage.style.display = 'none';
        topicList.forEach(topic => {
            cardGrid.appendChild(createCardElement(topic));
        });
    }
}

// --- Sorting Functionality ---

function handleSort() {
    const sortValue = sortBySelect.value;
    let sortedTopics = [...topics];

    sortedTopics.sort((a, b) => {
        switch (sortValue) {
            case 'oldest':
                return new Date(a.created) - new Date(b.created);
            case 'title-asc':
                return a.title.localeCompare(b.title);
            case 'title-desc':
                return b.title.localeCompare(a.title);
            case 'newest':
            default:
                return new Date(b.created) - new Date(a.created);
        }
    });

    renderCards(sortedTopics);
}


// --- Modal and Form Handlers ---

function openNewTopicModal() {
    topicForm.reset();
    document.getElementById('topic-id').value = '';
    topicTitleInput.value = '';
    topicContentArea.innerHTML = '';
    topicTagsInput.value = '';
    topicUrlInput.value = '';
    topicContentArea.setAttribute('contenteditable', 'true'); 
    topicContentArea.style.cursor = 'text';
    modalTitle.textContent = 'Create New Topic';
    topicForm.style.display = 'grid'; 
    
    // Clean up view elements if they exist
    let vc = document.querySelector('.topic-view-content');
    let cd = document.querySelector('.modal-controls');
    if(vc) vc.remove();
    if(cd) cd.remove();

    topicModal.style.display = 'flex'; // Use flex to ensure centering
}

function closeModal() {
    // Reset form display state and remove view components before closing
    topicForm.style.display = 'grid';
    topicContentArea.setAttribute('contenteditable', 'true');
    topicContentArea.style.cursor = 'text';

    let vc = document.querySelector('.topic-view-content');
    let cd = document.querySelector('.modal-controls');
    if(vc) vc.remove();
    if(cd) cd.remove();

    topicModal.style.display = 'none';
}

function handleFormSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('topic-id').value;
    const title = topicTitleInput.value.trim();
    const content = topicContentArea.innerHTML.trim();
    
    const tags = topicTagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    const sourceUrl = topicUrlInput.value.trim();

    if (!title || !content) {
        alert('Title and Content cannot be empty.');
        return;
    }

    if (id) {
        const topicIndex = topics.findIndex(t => t.id === id);
        if (topicIndex !== -1) {
            topics[topicIndex].title = title;
            topics[topicIndex].content = content;
            topics[topicIndex].tags = tags;
            topics[topicIndex].sourceUrl = sourceUrl;
        }
    } else {
        const newTopic = {
            id: Date.now().toString(),
            title: title,
            content: content,
            tags: tags,
            sourceUrl: sourceUrl,
            created: new Date().toISOString()
        };
        topics.unshift(newTopic);
    }

    saveTopics();
    handleSort();
    closeModal();
}

function showTopicDetails(id) {
    const topic = topics.find(t => t.id === id);
    if (!topic) return;

    // Remove any existing view/control elements
    let controlsDiv = document.querySelector('.modal-controls');
    let viewContent = document.querySelector('.topic-view-content');
    if (controlsDiv) controlsDiv.remove();
    if (viewContent) viewContent.remove();

    // Populate hidden form fields with data
    modalTitle.textContent = topic.title;
    topicTitleInput.value = topic.title;
    topicContentArea.innerHTML = topic.content;
    topicTagsInput.value = (topic.tags || []).join(', ');
    topicUrlInput.value = topic.sourceUrl || '';
    document.getElementById('topic-id').value = topic.id;
    
    // Hide the form and show the view components
    topicForm.style.display = 'none'; 

    viewContent = document.createElement('div');
    viewContent.className = 'topic-view-content rich-text-area'; 
    viewContent.setAttribute('contenteditable', 'false'); 
    viewContent.innerHTML = topic.content;
    viewContent.style.cursor = 'default';
    
    controlsDiv = document.createElement('div');
    controlsDiv.className = 'modal-controls';
    controlsDiv.innerHTML = `
        <button type="button" class="button-icon" id="edit-btn" title="Edit">
            <i class="fas fa-edit"></i>
        </button>
        <button type="button" class="button-icon" id="delete-btn" title="Delete">
            <i class="fas fa-trash-alt"></i>
        </button>
    `;

    document.querySelector('.modal-content').appendChild(viewContent);
    document.querySelector('.modal-content').appendChild(controlsDiv);

    document.getElementById('edit-btn').addEventListener('click', () => {
        // Switch to edit mode
        viewContent.remove();
        controlsDiv.remove();
        modalTitle.textContent = `Edit Topic: ${topic.title}`;
        topicContentArea.setAttribute('contenteditable', 'true');
        topicContentArea.style.cursor = 'text';
        topicForm.style.display = 'grid'; 
    });

    document.getElementById('delete-btn').addEventListener('click', () => {
        if (confirm(`Are you sure you want to delete the topic: "${topic.title}"?`)) {
            deleteTopic(topic.id);
            closeModal();
        }
    });

    topicModal.style.display = 'flex'; // Use flex to ensure centering

    // This listener handles clicking the modal background to close it.
    topicModal.onclick = function(event) {
        if (event.target === topicModal) {
            closeModal();
        }
    }
}

function deleteTopic(id) {
    topics = topics.filter(t => t.id !== id);
    saveTopics();
    handleSort();
}

function deleteAllTopics() {
    if (confirm('Are you sure you want to delete ALL topics? This action cannot be undone.')) {
        topics = [];
        saveTopics();
        handleSort();
    }
}

// --- Rich Text Editor Utilities ---

function formatText(command, value = null) {
    document.execCommand(command, false, value);
    topicContentArea.focus();
}

function formatColor(colorName) {
    const root = document.documentElement;
    const colorValue = getComputedStyle(root).getPropertyValue(`--editor-${colorName}`).trim();
    formatText('foreColor', colorValue);
}

// --- Search Functionality ---

function handleSearch() {
    const query = searchInput.value.toLowerCase().trim();
    
    let filteredTopics = topics.filter(topic => {
        const titleMatch = topic.title.toLowerCase().includes(query);
        const tagsMatch = (topic.tags || []).some(tag => tag.toLowerCase().includes(query));
        const contentMatch = topic.content.toLowerCase().includes(query); 
        return titleMatch || tagsMatch || contentMatch; 
    });
    
    const sortValue = sortBySelect.value;
    
    filteredTopics.sort((a, b) => {
        switch (sortValue) {
            case 'oldest':
                return new Date(a.created) - new Date(b.created);
            case 'title-asc':
                return a.title.localeCompare(b.title);
            case 'title-desc':
                return b.title.localeCompare(a.title);
            case 'newest': 
            default:
                return new Date(b.created) - new Date(a.created);
        }
    });
    
    renderCards(filteredTopics);
}

// --- Import/Export Functionality ---

function handleExport() {
    const dataStr = JSON.stringify(topics, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'beto_saver_export.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const importedTopics = JSON.parse(event.target.result);
            if (!Array.isArray(importedTopics)) {
                throw new Error('File content is not a valid list of topics.');
            }

            let newTopicsCount = 0;
            const existingTopicSet = new Set(topics.map(t => `${t.title.trim()}|${t.content.trim()}`));

            importedTopics.forEach(importedTopic => {
                const title = importedTopic.title ? importedTopic.title.trim() : 'Untitled';
                const content = importedTopic.content ? importedTopic.content.trim() : '';

                const uniqueKey = `${title}|${content}`;
                if (!existingTopicSet.has(uniqueKey)) {
                    const newTopic = {
                        id: importedTopic.id || (Date.now().toString() + Math.random().toString().substring(2, 5)),
                        title: title,
                        content: content,
                        tags: Array.isArray(importedTopic.tags) ? importedTopic.tags : [],
                        sourceUrl: importedTopic.sourceUrl || '',
                        created: importedTopic.created || new Date().toISOString()
                    };
                    topics.unshift(newTopic);
                    existingTopicSet.add(uniqueKey);
                    newTopicsCount++;
                }
            });

            if (newTopicsCount > 0) {
                saveTopics();
                handleSort();
                alert(`${newTopicsCount} new topic(s) imported successfully!`);
            } else {
                alert('No new topics were imported. All topics in the file already exist.');
            }

        } catch (error) {
            console.error('Import error:', error);
            alert('Failed to import topics. Please ensure the file is a correctly formatted JSON array.');
        } finally {
            e.target.value = '';
        }
    };
    reader.readAsText(file);
}

// --- Global Event Listeners ---

function attachGlobalListeners() {
    // Mode Toggle
    if (modeToggleButton) {
        modeToggleButton.addEventListener('click', toggleTheme);
    }

    // Open/Close Modal (New Topic)
    if (newTopicButton) {
        newTopicButton.addEventListener('click', openNewTopicModal);
    }
    
    // Universal close button for modal
    closeButton.addEventListener('click', closeModal);

    // Window click handler for closing modal when clicking the backdrop (outside modal-content)
    window.addEventListener('click', (event) => {
        if (event.target === topicModal) {
            closeModal();
        }
    });
    
    // ESC key handler to close modal
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && topicModal.style.display === 'flex') {
            closeModal();
        }
    });
    
    // Form Submission
    topicForm.addEventListener('submit', handleFormSubmit);

    // Rich Text Utilities
    document.getElementById('bold-btn').addEventListener('click', () => formatText('bold'));
    document.getElementById('underline-btn').addEventListener('click', () => formatText('underline'));
    document.getElementById('italic-btn').addEventListener('click', () => formatText('italic'));
    
    document.querySelector('.color-blue').addEventListener('click', () => formatColor('blue'));
    document.querySelector('.color-yellow').addEventListener('click', () => formatColor('yellow'));
    document.querySelector('.color-red').addEventListener('click', () => formatColor('red'));
    
    document.getElementById('clear-format-btn').addEventListener('click', () => formatText('removeFormat'));


    // Search and Sort
    searchInput.addEventListener('input', handleSearch);
    
    // Custom Dropdown Setup
    const sortTrigger = document.getElementById('sort-trigger');
    const sortMenu = document.getElementById('sort-menu');
    const dropdownItems = sortMenu.querySelectorAll('.dropdown-item');
    const sortLabel = document.getElementById('sort-label');
    
    sortTrigger.addEventListener('click', () => {
        sortMenu.classList.toggle('open');
        sortTrigger.classList.toggle('active');
    });
    
    dropdownItems.forEach(item => {
        item.addEventListener('click', () => {
            const value = item.getAttribute('data-value');
            const text = item.textContent;
            
            // Update hidden input value
            sortBySelect.value = value;
            
            // Update label
            sortLabel.textContent = text;
            
            // Update active state
            dropdownItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            
            // Close dropdown
            sortMenu.classList.remove('open');
            sortTrigger.classList.remove('active');
            
            // Trigger search/sort
            handleSearch();
        });
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (event) => {
        if (!event.target.closest('.custom-dropdown')) {
            sortMenu.classList.remove('open');
            sortTrigger.classList.remove('active');
        }
    });

    // Import/Export
    exportButton.addEventListener('click', handleExport);
    importFile.addEventListener('change', handleImport);
    
    // Delete All
    if (deleteAllButton) {
        deleteAllButton.addEventListener('click', deleteAllTopics);
    }
}